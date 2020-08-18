import * as sdk from 'botpress/sdk'
import { Paging } from 'botpress/sdk'
import fse from 'fs-extra'
import Joi, { object } from 'joi'
import _ from 'lodash'
import mkdirp from 'mkdirp'
import nanoid from 'nanoid/generate'
import path from 'path'
import { BPFS_STORAGE } from 'process'
import tar from 'tar'
import tmp from 'tmp'

import { ImportArgs } from './api'
import { Dic, Item } from './qna'

const safeId = (length = 10) => nanoid('1234567890abcdefghijklmnopqrsuvwxyz', length)
const slugify = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '_')

const makeId = (item: Item) => {
  const firstQuestion = item.questions[Object.keys(item.questions)[0]][0]
  return `__qna__${safeId()}_${slugify(firstQuestion)
    .replace(/^_+/, '')
    .substring(0, 50)
    .replace(/_+$/, '')}`
}

const normalizeQuestions = (questions: string[]) =>
  questions
    .map(q =>
      q
        .replace(/[\r\n]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter(Boolean)

type Metadata = {
  answers: Dic<string[]>
  contentAnswers: any[]
  enabled: boolean
  lastModifiedOn: Date
}

const LangStringArrSchema = Joi.object().pattern(
  Joi.string()
    .min(1)
    .max(3)
    .required(),
  Joi.array().items(
    Joi.string()
      .not()
      .empty()
  )
)

const QnaItemContentAnswerSchema = Joi.object().pattern(
  Joi.string(),
  Joi.alternatives().try(
    Joi.number(),
    Joi.boolean(),
    // tslint:disable-next-line
    Joi.allow(null),
    Joi.string().allow(''),
    Joi.array().items(Joi.object())
  )
)

const ItemSchema = Joi.object().keys({
  id: Joi.string()
    .min(1)
    .optional(),
  questions: LangStringArrSchema.required(),
  answers: LangStringArrSchema.required(),
  contentAnswers: Joi.array()
    .items(QnaItemContentAnswerSchema)
    .default([]),
  enabled: Joi.bool().required(),
})

type Intent = Omit<sdk.NLU.IntentDefinition, 'metadata'> & { metadata?: Metadata }

const FLOW_FOLDER = 'flows'
const MEDIA_FOLDER = 'media'
const toQnaFile = topicName => path.join(topicName, 'qna.intents.json')

const serialize = (intents: Intent[]) => JSON.stringify(intents, undefined, 2)

export default class Storage {
  constructor(private ghost: sdk.ScopedGhostService) { }

  // TODO: validate no dupes

  private async ensureIntentsFileExists(topicName: string) {
    if (!(await this.ghost.fileExists(FLOW_FOLDER, toQnaFile(topicName)))) {
      await this.ghost.upsertFile(FLOW_FOLDER, toQnaFile(topicName), serialize([]))
    }
  }

  async fetchItems(topicName: string, opts?: Paging): Promise<Item[]> {
    await this.ensureIntentsFileExists(topicName)
    const intents = await this.ghost.readFileAsObject<Intent[]>(FLOW_FOLDER, toQnaFile(topicName))

    const items = intents.map<Item>(intent => ({
      id: intent.name,
      questions: intent.utterances,
      answers: intent.metadata?.answers,
      contentAnswers: intent.metadata?.contentAnswers,
      enabled: intent.metadata?.enabled,
      lastModified: intent.metadata?.lastModifiedOn
    }))

    if (opts?.start !== undefined && opts?.count > -1) {
      // TODO: move filtering & search to API layer
      return items.slice(opts.start, opts.start + opts.count)
    } else {
      return items
    }
  }

  async updateSingleItem(topicName: string, item: Item): Promise<string> {
    item = await ItemSchema.validate(item)
    await this.ensureIntentsFileExists(topicName)

    const items = await this.fetchItems(topicName)
    let newItems: Item[]

    if (!item.id?.length) {
      item.id = makeId(item)
      newItems = [item, ...items]
    } else {
      newItems = [...items]
      newItems[items.findIndex(i => i.id === item.id)] = item
    }

    const intents = newItems.map<Intent>(i => ({
      name: i.id,
      contexts: [topicName],
      filename: toQnaFile(topicName),
      slots: [],
      utterances: _.mapValues(i.questions, q => normalizeQuestions(q)),
      metadata: {
        answers: i.answers,
        contentAnswers: i.contentAnswers,
        enabled: i.enabled,
        lastModifiedOn: i.id === item.id ? new Date() : i.lastModified
      }
    }))

    await this.ghost.upsertFile(FLOW_FOLDER, toQnaFile(topicName), serialize(intents))
    return item.id
  }

  async getCountPerTopic() {
    // TODO Make this parallel
    const qnaFilesPerTopic = await this.ghost.directoryListing(FLOW_FOLDER, 'qna.intents.json')
    const qnaPerTopic = {}
    for (const qnaFile of qnaFilesPerTopic) {
      qnaPerTopic[qnaFile.split('/')[0]] = (await this.ghost.readFileAsObject<Intent[]>(FLOW_FOLDER, qnaFile)).length
    }
    return qnaPerTopic
  }

  async deleteSingleItem(topicName: string, itemId: string) {
    await this.ensureIntentsFileExists(topicName)
    const intents = await this.ghost.readFileAsObject<Intent[]>(FLOW_FOLDER, toQnaFile(topicName))
    const newIntents = intents.filter(x => x.name !== itemId)
    await this.ghost.upsertFile(FLOW_FOLDER, toQnaFile(topicName), serialize(newIntents))
  }

  async exportPerTopic(topicName: string) {
    const tmpDir = tmp.dirSync({ unsafeCleanup: true })
    const zipName = path.join(tmpDir.name, `${topicName}.tar.gz`)
    await mkdirp.sync(path.join(tmpDir.name, MEDIA_FOLDER))

    const keepEndPath = path => path.split('/').slice(-2).join('/')
    const removeBotPrefix = c => c.items ?
      { ...c, items: c.items.map(o => { return { ...o, image: keepEndPath(o.image) } }) } :
      { ...c, image: keepEndPath(c.image) }

    const jsonQnaForBot = await this.ghost.readFileAsObject<Intent[]>(FLOW_FOLDER, toQnaFile(topicName))
    const jsonQna = jsonQnaForBot.map(i => {
      const newContent = [...i.metadata.contentAnswers].map(c => removeBotPrefix(c))
      const newMetadata = { ...i.metadata, contentAnswers: newContent }
      return { ...i, metadata: newMetadata }
    })
    const contentToExport: sdk.FormData[] = _.flatMapDeep(jsonQna.map(i => i.metadata.contentAnswers))
    const mediaToExport = _.flatMapDeep(contentToExport.map(c => c.items ? c.items.map(i => i.image) : c.image))

    await this.ghost.upsertFile(FLOW_FOLDER, 'exportable.qna.intents.json', serialize(jsonQna))

    const filesToZip = [...mediaToExport, path.join(FLOW_FOLDER, 'exportable.qna.intents.json')]

    for (const file of filesToZip) {
      await mkdirp.sync(path.dirname(path.join(tmpDir.name, file)))
      const buff = await this.ghost.readFileAsBuffer('/', file)
      fse.writeFileSync(path.resolve(tmpDir.name, file), buff)
    }

    await tar.create(
      {
        cwd: tmpDir.name,
        file: zipName,
        portable: true,
        gzip: true
      },
      filesToZip
    )
    const zipBuffer = await fse.readFile(zipName)
    await this.ghost.deleteFile(FLOW_FOLDER, 'exportable.qna.intents.json')
    tmp.setGracefulCleanup()
    return zipBuffer
  }

  async importPerTopic(importArgs: ImportArgs) {
    const { topicName, botId, zipFile, bpCms, override, clean } = importArgs
    const addBotPath = file => path.join(`/api/v1/bots/${botId}`, file)
    const addBotPrefix = c => c.items ?
      { ...c, items: c.items.map(o => { return { ...o, image: addBotPath(o.image) } }) } :
      { ...c, image: addBotPath(c.image) }

    if (!clean) {
      const questions = await this.fetchItems(topicName)
      await Promise.map(questions, q => this.deleteSingleItem(topicName, q.id))
    }

    const tmpDir = tmp.dirSync({ unsafeCleanup: true })
    await fse.writeFileSync(path.join(tmpDir.name, `${topicName}.tar.gz`), zipFile)
    await tar.extract({
      cwd: tmpDir.name,
      file: path.join(tmpDir.name, `${topicName}.tar.gz`)
    })

    const qnas = JSON.parse(fse.readFileSync(path.join(tmpDir.name, FLOW_FOLDER, 'exportable.qna.intents.json'), 'utf8'))
    const qnaForBot = qnas.map(i => {
      const newContent = [...i.metadata.contentAnswers].map(c => addBotPrefix(c))
      const newMetadata = { ...i.metadata, contentAnswers: newContent }
      return { ...i, contexts: [topicName], filename: `${topicName}/qna.intents.json`, metadata: newMetadata }
    })

    await this.ghost.upsertFile(FLOW_FOLDER,
      path.join(topicName, 'qna.intents.json'),
      serialize(qnaForBot)
    )

    for (const mediaFile of fse.readdirSync(path.join(tmpDir.name, MEDIA_FOLDER))) {
      await this.ghost.upsertFile(MEDIA_FOLDER,
        mediaFile,
        fse.readFileSync(path.join(tmpDir.name, MEDIA_FOLDER, mediaFile))
      )
    }
  }
}






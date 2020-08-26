import * as sdk from 'botpress/sdk'
import { Paging } from 'botpress/sdk'
import fse from 'fs-extra'
import Joi, { object } from 'joi'
import _ from 'lodash'
import mkdirp from 'mkdirp'
import nanoid from 'nanoid/generate'
import path from 'path'
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

const contentShema = Joi.object().keys({
  items: Joi.array().items(Joi.object().keys({
    image: Joi.string(),
    title: Joi.object().pattern(Joi.string(), Joi.string().allow(null)),
    subtitle: Joi.object().pattern(Joi.string(), Joi.string().allow(null)),
    actions: Joi.array()
  })),
  image: Joi.string(),
  title: Joi.object().pattern(Joi.string().max(2), Joi.string().allow(null)).optional(),
  markdown: Joi.boolean(),
  typing: Joi.boolean(),
  contentType: Joi.string()
}).xor('items', 'image')


const QnASchema = Joi.object().keys({
  name: Joi.string(),
  contexts: Joi.array().items(Joi.string()),
  filename: Joi.string(),
  slots: Joi.array(),
  utterances: Joi.object().pattern(Joi.string().max(2), Joi.array().items(Joi.string())),
  metadata: Joi.object().keys({
    answers: Joi.object().pattern(Joi.string().max(2), Joi.array().items(Joi.string())),
    contentAnswers: Joi.array().items(contentShema),
    enabled: Joi.boolean(),
    lastModifiedOn: Joi.string().optional()
  })
})

type Intent = Omit<sdk.NLU.IntentDefinition, 'metadata'> & { metadata?: Metadata }

const FLOW_FOLDER = 'flows'
const MEDIA_FOLDER = 'media'
const TEMP_INTENT_FILENAME = 'exportable.qna.intents.json'
const INTENT_FILENAME = 'qna.intents.json'
const QNA_PATH_TO_ZIP = path.join(FLOW_FOLDER, TEMP_INTENT_FILENAME)

const toQnaFile = topicName => path.join(topicName, INTENT_FILENAME)
const toZipFile = topicName => `${topicName}.qna.tar.gz`
const serialize = (intents: Intent[]) => JSON.stringify(intents, undefined, 2)

const keepEndPath = path => path.split('/').slice(-2).join('/')
const removeBotPrefix = c => c.items ?
  { ...c, items: c.items.map(o => { return { ...o, image: keepEndPath(o.image) } }) } :
  { ...c, image: keepEndPath(c.image) }

const addBotPath = (file, botId) => path.join(`/api/v1/bots/${botId}`, file)
const addBotPrefix = (c, botId) => c.items ?
  { ...c, items: c.items.map(o => { return { ...o, image: addBotPath(o.image, botId) } }) } :
  { ...c, image: addBotPath(c.image, botId) }

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
    return items
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
    const qnaFilesPerTopic = await this.ghost.directoryListing(FLOW_FOLDER, INTENT_FILENAME)
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
    const zipName = path.join(tmpDir.name, toZipFile(topicName))
    await mkdirp.sync(path.join(tmpDir.name, MEDIA_FOLDER))

    const jsonQnaForBot = await this.ghost.readFileAsObject<Intent[]>(FLOW_FOLDER, toQnaFile(topicName))
    const jsonQnaBotAgnostic = jsonQnaForBot.map(i => {
      const contentAnswers = [...i.metadata?.contentAnswers ?? []].map(c => removeBotPrefix(c))
      const metadata = { ...i.metadata, contentAnswers }
      return { ...i, metadata }
    })

    const medias = _.chain(jsonQnaBotAgnostic)
      .flatMapDeep(item => item.metadata?.contentAnswers ?? [])
      .flatMap(c => c.items ? c.items : [c])
      .map(c => c.image)
      .value()


    await mkdirp.sync(path.join(tmpDir.name, path.dirname(QNA_PATH_TO_ZIP)))
    await fse.writeFile(path.join(tmpDir.name, QNA_PATH_TO_ZIP), Buffer.from(serialize(jsonQnaBotAgnostic)))
    await Promise.all(medias.map(async mediaFile => await fse.writeFile(path.resolve(tmpDir.name, mediaFile), await this.ghost.readFileAsBuffer('/', mediaFile))))

    await tar.create({ cwd: tmpDir.name, file: zipName, portable: true, gzip: true }, [...medias, QNA_PATH_TO_ZIP])
    const zipBuffer = await fse.readFile(zipName)
    tmp.setGracefulCleanup()
    return zipBuffer
  }

  async importPerTopic(importArgs: ImportArgs) {
    const { topicName, botId, zipFile } = importArgs

    const tmpDir = tmp.dirSync({ unsafeCleanup: true })
    await fse.writeFile(path.join(tmpDir.name, toZipFile(topicName)), zipFile)
    await tar.extract({ cwd: tmpDir.name, file: path.join(tmpDir.name, toZipFile(topicName)) })


    let qnasBotAgnostic = JSON.parse(await fse.readFile(path.join(tmpDir.name, FLOW_FOLDER, TEMP_INTENT_FILENAME), 'utf8'))
    qnasBotAgnostic = await Joi.array().items(QnASchema).validate(qnasBotAgnostic)

    const qnaForBot = qnasBotAgnostic.map(i => {
      const newContent = [...i.metadata.contentAnswers].map(c => addBotPrefix(c, botId))
      const newMetadata = { ...i.metadata, contentAnswers: newContent }
      return { ...i, contexts: [topicName], filename: path.join(topicName, INTENT_FILENAME), metadata: newMetadata }
    })

    await this.ghost.upsertFile(FLOW_FOLDER, path.join(topicName, INTENT_FILENAME), serialize(qnaForBot))

    for (const mediaFile of fse.readdirSync(path.join(tmpDir.name, MEDIA_FOLDER))) {
      await this.ghost.upsertFile(MEDIA_FOLDER, mediaFile, await fse.readFile(path.join(tmpDir.name, MEDIA_FOLDER, mediaFile))
      )
    }
  }
}






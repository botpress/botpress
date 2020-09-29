import * as sdk from 'botpress/sdk'
import fse from 'fs-extra'
import _ from 'lodash'
import mkdirp from 'mkdirp'
import nanoid from 'nanoid/generate'
import path from 'path'
import tar from 'tar'
import tmp from 'tmp'

import { ImportArgs } from './api'
import { Dic, Item } from './qna'
import { ItemSchema, QnASchemaArray } from './validation'

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

interface Metadata {
  answers: Dic<string[]>
  contentAnswers: sdk.Content.All[]
  enabled: boolean
  lastModifiedOn: Date
}

type Intent = Omit<sdk.NLU.IntentDefinition, 'metadata'> & { metadata?: Metadata }

const FLOW_FOLDER = 'flows'
const MEDIA_FOLDER = 'media'
const TEMP_INTENT_FILENAME = 'exportable.qna.intents.json'
const INTENT_FILENAME = 'qna.intents.json'
const QNA_PATH_TO_ZIP = path.join(FLOW_FOLDER, TEMP_INTENT_FILENAME)

const toQnaFile = topicName => path.join(topicName, INTENT_FILENAME)
const toZipFile = topicName => `${topicName}.qna.tar.gz`
const serialize = (intents: Intent[]) => JSON.stringify(intents, undefined, 2)

const keepEndPath = path =>
  path
    .split('/')
    .slice(-2)
    .join('/')

const removeBotPrefix = (c: sdk.Content.All) => {
  if ((c as sdk.Content.Carousel).items) {
    const carousel = c as sdk.Content.Carousel
    return {
      ...carousel,
      items: carousel.items.map(o => {
        return { ...o, image: keepEndPath(o.image) }
      })
    }
  } else if ((c as sdk.Content.Card | sdk.Content.Image).image) {
    const image = c as sdk.Content.Image | sdk.Content.Card
    return {
      ...image,
      image: keepEndPath(image.image)
    }
  } else {
    return c
  }
}

const addBotPath = (file, botId) => path.join(`/api/v1/bots/${botId}`, file)
const addBotPrefix = (c: sdk.Content.All, botId: string) => {
  if ((c as sdk.Content.Carousel).items) {
    const carousel = c as sdk.Content.Carousel
    return {
      ...carousel,
      items: carousel.items.map(o => {
        return { ...o, image: addBotPath(o.image, botId) }
      })
    }
  } else if ((c as sdk.Content.Card | sdk.Content.Image).image) {
    const image = c as sdk.Content.Image | sdk.Content.Card
    return { ...image, image: addBotPath(image.image, botId) }
  } else {
    return c
  }
}

export default class Storage {
  constructor(private ghost: sdk.ScopedGhostService) {}

  // TODO: validate no dupes

  private async ensureIntentsFileExists(topicName: string) {
    if (!(await this.ghost.fileExists(FLOW_FOLDER, toQnaFile(topicName)))) {
      await this.ghost.upsertFile(FLOW_FOLDER, toQnaFile(topicName), serialize([]))
    }
  }

  async fetchItems(topicName: string, opts?: sdk.Paging): Promise<Item[]> {
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
      const contentAnswers = [...(i.metadata?.contentAnswers ?? [])].map((c: sdk.Content.All) => removeBotPrefix(c))
      const metadata = { ...i.metadata, contentAnswers }
      return { ...i, metadata }
    })

    const medias = _.chain(jsonQnaBotAgnostic)
      .flatMapDeep(item => item.metadata?.contentAnswers ?? [])
      .flatMap(c => {
        if ((c as sdk.Content.Carousel).items) {
          const carousel = c as sdk.Content.Carousel
          return carousel.items
        } else {
          return [c]
        }
      })
      .map(c => _.get(c, 'image', undefined))
      .filter(c => c)
      .value()

    await mkdirp.sync(path.join(tmpDir.name, path.dirname(QNA_PATH_TO_ZIP)))
    await fse.writeFile(path.join(tmpDir.name, QNA_PATH_TO_ZIP), Buffer.from(serialize(jsonQnaBotAgnostic)))
    await Promise.all(
      medias.map(
        async mediaFile =>
          await fse.writeFile(path.resolve(tmpDir.name, mediaFile), await this.ghost.readFileAsBuffer('/', mediaFile))
      )
    )

    await tar.create({ cwd: tmpDir.name, file: zipName, portable: true, gzip: true }, [...medias, QNA_PATH_TO_ZIP])
    const zipBuffer = await fse.readFile(zipName)
    tmp.setGracefulCleanup()
    return zipBuffer
  }

  async moveToAnotherTopic(sourceTopic: string, targetTopic: string) {
    const sourceQnaFile = toQnaFile(sourceTopic)
    const targetQnaFile = toQnaFile(targetTopic)

    if (!(await this.ghost.fileExists(FLOW_FOLDER, sourceQnaFile))) {
      return
    }

    const itemsBuff = await this.ghost.readFileAsBuffer(FLOW_FOLDER, sourceQnaFile)
    return Promise.all([
      this.ghost.upsertFile(FLOW_FOLDER, targetQnaFile, itemsBuff),
      this.ghost.deleteFile(FLOW_FOLDER, sourceQnaFile)
    ])
  }

  async importArchivePerTopic(importArgs: ImportArgs) {
    const { topicName, botId, zipFile } = importArgs

    const tmpDir = tmp.dirSync({ unsafeCleanup: true })
    await fse.writeFile(path.join(tmpDir.name, toZipFile(topicName)), zipFile)
    await tar.extract({ cwd: tmpDir.name, file: path.join(tmpDir.name, toZipFile(topicName)) })

    let qnasBotAgnostic: Intent[] = JSON.parse(
      await fse.readFile(path.join(tmpDir.name, FLOW_FOLDER, TEMP_INTENT_FILENAME), 'utf8')
    )
    qnasBotAgnostic = await QnASchemaArray.validate(qnasBotAgnostic)

    const qnaForBot: Intent[] = qnasBotAgnostic.map(i => {
      const newContent = [...i.metadata.contentAnswers].map(c => addBotPrefix(c, botId))
      const newMetadata = { ...i.metadata, contentAnswers: newContent }
      return { ...i, contexts: [topicName], filename: path.join(topicName, INTENT_FILENAME), metadata: newMetadata }
    })

    await this.ghost.upsertFile(FLOW_FOLDER, path.join(topicName, INTENT_FILENAME), serialize(qnaForBot))

    if (await fse.pathExists(path.join(tmpDir.name, MEDIA_FOLDER))) {
      for (const mediaFile of await fse.readdir(path.join(tmpDir.name, MEDIA_FOLDER))) {
        await this.ghost.upsertFile(
          MEDIA_FOLDER,
          mediaFile,
          await fse.readFile(path.join(tmpDir.name, MEDIA_FOLDER, mediaFile))
        )
      }
    }
  }
}

import * as sdk from 'botpress/sdk'
import { Paging } from 'botpress/sdk'
import Joi from 'joi'
import _ from 'lodash'
import nanoid from 'nanoid/generate'
import path from 'path'

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
  enabled: Joi.bool().required()
})

type Intent = Omit<sdk.NLU.IntentDefinition, 'metadata'> & { metadata?: Metadata }

const ROOT_FOLDER = 'flows'
const toQnaFile = topicName => `${topicName}/qna.intents.json`

const serialize = (intents: Intent[]) => JSON.stringify(intents, undefined, 2)

export default class Storage {
  constructor(private ghost: sdk.ScopedGhostService) {}

  // TODO: validate no dupes

  private async ensureIntentsFileExists(topicName: string) {
    if (!(await this.ghost.fileExists(ROOT_FOLDER, toQnaFile(topicName)))) {
      await this.ghost.upsertFile(ROOT_FOLDER, toQnaFile(topicName), serialize([]))
    }
  }

  async fetchItems(topicName: string, opts?: Paging): Promise<Item[]> {
    await this.ensureIntentsFileExists(topicName)
    const intents = await this.ghost.readFileAsObject<Intent[]>(ROOT_FOLDER, toQnaFile(topicName))

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

    await this.ghost.upsertFile(ROOT_FOLDER, toQnaFile(topicName), serialize(intents))
    return item.id
  }

  async getCountPerTopic() {
    // TODO Make this parallel
    const qnaFilesPerTopic = await this.ghost.directoryListing(ROOT_FOLDER, 'qna.intents.json')
    const qnaPerTopic = {}
    for (const qnaFile of qnaFilesPerTopic) {
      qnaPerTopic[qnaFile.split('/')[0]] = (await this.ghost.readFileAsObject<Intent[]>(ROOT_FOLDER, qnaFile)).length
    }
    return qnaPerTopic
  }

  async deleteSingleItem(topicName: string, itemId: string) {
    await this.ensureIntentsFileExists(topicName)
    const intents = await this.ghost.readFileAsObject<Intent[]>(ROOT_FOLDER, toQnaFile(topicName))
    const newIntents = intents.filter(x => x.name !== itemId)
    await this.ghost.upsertFile(ROOT_FOLDER, toQnaFile(topicName), serialize(newIntents))
  }

  async count(topicName: string) {
    const questions = await this.fetchItems(topicName)
    return questions.length
  }
}

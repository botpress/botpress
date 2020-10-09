import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import nanoid from 'nanoid/generate'
import path from 'path'

import { Dic, Item, ItemLegacy } from './qna'
import { ItemSchema } from './validation'

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

const INTENT_FILENAME = 'qna.intents.json'

const toQnaFile = topicName => path.join(topicName, INTENT_FILENAME)

const serialize = (intents: Intent[]) => JSON.stringify(intents, undefined, 2)

const itemToIntent = (item: ItemLegacy, topicName: string): Intent => {
  return {
    name: item.id,
    contexts: item.contexts,
    filename: toQnaFile(topicName),
    slots: [],
    utterances: _.mapValues(item.questions, q => normalizeQuestions(q)),
    metadata: {
      ..._.pick(item, ['answers', 'contentAnswers', 'enabled', 'redirectFlow', 'redirectNode', 'action']),
      action: item.action || 'text',
      lastModifiedOn: item.id === item.id ? new Date() : item.lastModified
    } as any
  }
}

export default class StorageLegacy {
  constructor(private ghost: sdk.ScopedGhostService) {}

  // TODO: validate no dupes

  private async ensureIntentsFileExists(topicName: string) {
    if (!(await this.ghost.fileExists(FLOW_FOLDER, toQnaFile(topicName)))) {
      await this.ghost.upsertFile(FLOW_FOLDER, toQnaFile(topicName), serialize([]))
    }
  }

  async getQnaItem(qnaEntry) {
    const all = await this.fetchItems()
    return all.find(x => x.id === qnaEntry)
  }

  async fetchItems(): Promise<ItemLegacy[]> {
    const files = await this.ghost.directoryListing(FLOW_FOLDER, '**/qna.intents.json')

    const allIntents = await Promise.mapSeries(files, async filename => {
      const intents = await this.ghost.readFileAsObject<Intent[]>(FLOW_FOLDER, filename)
      return intents.map(x => ({ ...x, location: filename }))
    })
    const intents = _.flatten(allIntents)

    const items = intents.map<ItemLegacy>(intent => ({
      id: intent.name,
      location: intent.location,
      questions: intent.utterances,
      answers: intent.metadata.answers!,
      contexts: intent.contexts,
      // @ts-ignore
      contentAnswers: intent.metadata.contentAnswers!,
      ..._.pick(intent.metadata, ['answers', 'contentAnswers', 'enabled', 'redirectFlow', 'redirectNode', 'action']),
      lastModified: intent.metadata?.lastModifiedOn
    }))
    return items
  }

  async _addInTopic(item: ItemLegacy, topicName: string) {
    await this.ensureIntentsFileExists(topicName)
    const filename = toQnaFile(topicName)
    const intents = await this.ghost.readFileAsObject<Intent[]>(FLOW_FOLDER, filename)

    await this.ghost.upsertFile(FLOW_FOLDER, filename, serialize([...intents, itemToIntent(item, filename)]))
  }

  async _delFromTopic(item: ItemLegacy, topicName: string) {
    const filename = toQnaFile(topicName)
    const intents = await this.ghost.readFileAsObject<Intent[]>(FLOW_FOLDER, filename)

    await this.ghost.upsertFile(FLOW_FOLDER, filename, serialize(intents.filter(x => x.name !== item.id)))
  }

  async _updateInTopic(item: ItemLegacy, topicName: string) {
    const filename = toQnaFile(topicName)
    const intents = await this.ghost.readFileAsObject<Intent[]>(FLOW_FOLDER, filename)

    await this.ghost.upsertFile(
      FLOW_FOLDER,
      filename,
      serialize([...intents.filter(x => x.name !== item.id), itemToIntent(item, filename)])
    )
  }

  async updateSingleItem(topicName: string, item: ItemLegacy): Promise<string> {
    item = await ItemSchema.validate(item)

    const items = await this.fetchItems()

    // creating, add in contexts
    if (!item.id?.length) {
      item.id = makeId(item)
      item.contexts.forEach(async context => {
        await this._addInTopic(item, context)
      })
    } else {
      const existingContexts = _.flatMap(
        items.filter(x => x.id === item.id),
        x => x.contexts
      )

      const identical = _.intersection(existingContexts, item.contexts)
      // contexts didn't change, just update in place
      if (identical.length === item.contexts.length) {
        item.contexts.forEach(async context => {
          await this._updateInTopic(item, context)
        })
      } else {
        // cleanup from old context and insert
        for (const context of existingContexts) {
          await this._delFromTopic(item, context)
        }

        for (const context of item.contexts) {
          await this._addInTopic(item, context)
        }
      }
    }

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
}

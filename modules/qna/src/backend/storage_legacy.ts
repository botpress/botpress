import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { ImportArgs } from './api'
import { exportQuestionsToArchive, importSingleArchive } from './archive'
import { Intent, ItemLegacy } from './qna'
import Storage from './storage'
import { FLOW_FOLDER, INTENT_FILENAME, makeId, normalizeQuestions, serialize, toQnaFile } from './utils'
import { ItemSchema } from './validation'

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

const intentToItem = ({ name, utterances, contexts, metadata }: Intent, location: string): ItemLegacy => {
  return {
    id: name,
    location,
    questions: utterances,
    answers: metadata.answers,
    contexts,
    ...(_.pick(metadata, ['answers', 'contentAnswers', 'enabled', 'redirectFlow', 'redirectNode', 'action']) as any),
    lastModified: metadata.lastModifiedOn
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

    return _.flatten(allIntents).map<ItemLegacy>(x => intentToItem(x, x.location))
  }

  async _addInTopic(item: ItemLegacy, topicName: string) {
    await this.ensureIntentsFileExists(topicName)
    const filename = toQnaFile(topicName)
    const intents = await this.ghost.readFileAsObject<Intent[]>(FLOW_FOLDER, filename)

    await this.ghost.upsertFile(FLOW_FOLDER, filename, serialize([...intents, itemToIntent(item, topicName)]))
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
      serialize([...intents.filter(x => x.name !== item.id), itemToIntent(item, topicName)])
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
    const items = await this.fetchItems()
    const item = items.find(x => x.id === itemId)

    if (item) {
      for (const context of item.contexts) {
        await this._delFromTopic(item, context)
      }
    }
  }

  async moveToAnotherTopic(sourceTopic: string, targetTopic: string) {
    const storage = new Storage(this.ghost)
    return storage.moveToAnotherTopic(sourceTopic, targetTopic)
  }

  async exportPerTopic(topicName: string) {
    const files = await this.ghost.directoryListing(FLOW_FOLDER, '**/qna.intents.json')

    const allIntents = await Promise.mapSeries(files, filename =>
      this.ghost.readFileAsObject<Intent[]>(FLOW_FOLDER, filename)
    )

    return exportQuestionsToArchive(_.flatten(allIntents), 'questions', this.ghost)
  }

  async importArchivePerTopic(importArgs: ImportArgs) {
    return importSingleArchive({ ...importArgs, topicName: undefined }, this.ghost)
  }

  async getContentElementUsage(): Promise<any> {
    const qnas = await this.fetchItems()

    return _.reduce(
      qnas,
      (result, qna) => {
        const answers = _.flatMap(Object.values(qna.answers))

        _.filter(answers, x => x.startsWith('#!')).forEach(answer => {
          const values = result[answer]
          if (values) {
            values.count++
          } else {
            result[answer] = { qna: qna.id, count: 1 }
          }
        })
        return result
      },
      {}
    )
  }
}

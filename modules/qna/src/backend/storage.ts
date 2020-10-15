import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { ImportArgs } from './api'
import { exportQuestionsToArchive, importArchivePerTopic } from './archive'
import { Intent, Item } from './qna'
import { FLOW_FOLDER, INTENT_FILENAME, makeId, normalizeQuestions, serialize, toQnaFile } from './utils'
import { ItemSchema } from './validation'

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
    const jsonQnaForBot = await this.ghost.readFileAsObject<Intent[]>(FLOW_FOLDER, toQnaFile(topicName))
    return exportQuestionsToArchive(jsonQnaForBot, topicName, this.ghost)
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
    return importArchivePerTopic(importArgs, this.ghost)
  }

  async getContentElementUsage(): Promise<any> {
    return {}
  }
}

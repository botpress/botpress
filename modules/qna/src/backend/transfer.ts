import _ from 'lodash'

import { QnaItem, QnaEntry } from './qna'
import Storage from './storage'

export const importQuestions = async (questions: QnaItem[], storage, config, statusCallback, uploadStatusId) => {
  statusCallback(uploadStatusId, 'Calculating diff with existing questions')

  const existingQuestionItems = (await (storage as Storage).fetchQNAs()).map(item => item.id)
  const itemsToSave = questions.filter(item => !existingQuestionItems.includes(item.id))
  const entriesToSave = itemsToSave.map(q => q.data)

  if (config.qnaMakerApiKey) {
    return storage.insert(entriesToSave.map(question => ({ ...question, enabled: true })))
  }

  let questionsSavedCount = 0
  return Promise.each(entriesToSave, async (question: QnaEntry) => {
    await (storage as Storage).insert({ ...question, enabled: true })
    questionsSavedCount += 1
    statusCallback(uploadStatusId, `Saved ${questionsSavedCount}/${entriesToSave.length} questions`)
  })
}

export const prepareExport = async (storage: Storage) => {
  const qnas = await storage.fetchQNAs()
  return JSON.stringify(qnas, undefined, 2)
}

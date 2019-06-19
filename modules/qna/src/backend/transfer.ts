import _ from 'lodash'

import { QnaItem, QnaEntry } from './qna'
import Storage from './storage'

function assertIsArrayOfQnaItems(data: QnaItem[]): data is QnaItem[] {
  if (!_.isArray(data)) {
    return false
  }
  return data.reduce((accumulator: boolean, current: QnaItem) => accumulator && assertIsQnaItem(current), true)
}

function assertIsQnaItem(data: QnaItem): data is QnaItem {
  return _.isString(data.id) && assertIsQnaEntry(data.data)
}

function assertIsQnaEntry(data: QnaEntry): data is QnaEntry {
  return (
    data &&
    (data.action === 'text' || data.action === 'redirect' || data.action === 'text_redirect') &&
    data.answers !== undefined &&
    _.isString(data.category) &&
    data.questions !== undefined &&
    _.isString(data.redirectFlow) &&
    _.isString(data.redirectNode)
  )
}

export const importQuestions = async (questions: QnaItem[], storage, config, statusCallback, uploadStatusId) => {
  statusCallback(uploadStatusId, 'Validating data format')

  // Not a perfect assertion, but better than nothing
  if (!assertIsArrayOfQnaItems(questions)) {
    throw new Error('Unable to convert file content to QNA items')
  }

  statusCallback(uploadStatusId, 'Calculating diff with existing questions')

  const existingQuestionItems = (await (storage as Storage).fetchQNAs()).map(item => item.id)
  const itemsToSave = questions.filter(item => !existingQuestionItems.includes(item.id))
  const entriesToSave = itemsToSave.map(q => q.data)

  if (config.qnaMakerApiKey) {
    return (storage as Storage).insert(entriesToSave.map(question => ({ ...question, enabled: true })))
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

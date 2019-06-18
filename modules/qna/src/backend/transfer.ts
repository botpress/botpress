import _ from 'lodash'

import * as parsers from './parsers.js'
import { QnaItem } from './qna'
import Storage from './storage'

const ANSWERS_SPLIT_CHAR = '†'

export const importQuestions = async (questions, params) => {
  const { storage, config, format = 'json', statusCallback, uploadStatusId } = params

  statusCallback(uploadStatusId, 'Calculating diff with existing questions')

  const existingQuestions = (await (storage as Storage).fetchQNAs()).map(item =>
    JSON.stringify(_.omit(item.data, 'enabled'))
  )

  const hasCategory = storage.hasCategories()
  const parsedQuestions =
    typeof questions === 'string' ? parsers[`${format}Parse`](questions, { hasCategory }) : questions
  const questionsToSave = parsedQuestions.filter(item => !existingQuestions.includes(JSON.stringify(item)))

  if (config.qnaMakerApiKey) {
    return storage.insert(questionsToSave.map(question => ({ ...question, enabled: true })))
  }

  let questionsSavedCount = 0
  return Promise.each(questionsToSave, async question => {
    const answers = question['answer'].split(ANSWERS_SPLIT_CHAR)
    await storage.insert({ ...question, answers, enabled: true })
    questionsSavedCount += 1
    statusCallback(uploadStatusId, `Saved ${questionsSavedCount}/${questionsToSave.length} questions`)
  })
}

export const prepareExport = async (storage: Storage, { flat = false } = {}) => {
  const qnas = await storage.fetchQNAs()
  const qnaEntries = _.flatMap(qnas, (question: QnaItem) => question.data)
  return JSON.stringify(qnaEntries, undefined, 2)
}

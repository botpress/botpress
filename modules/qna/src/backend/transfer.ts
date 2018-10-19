import _ from 'lodash'

import * as parsers from './parsers.js'

export const importQuestions = async (questions, params) => {
  const { storage, config, format = 'json', statusCallback, uploadStatusId } = params

  statusCallback(uploadStatusId, 'Calculating diff with existing questions')

  const existingQuestions = (await storage.fetchAllQuestions()).map(item =>
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
  return Promise.each(questionsToSave, question =>
    storage.insert({ ...question, enabled: true }).then(() => {
      questionsSavedCount += 1
      statusCallback(uploadStatusId, `Saved ${questionsSavedCount}/${questionsToSave.length} questions`)
    })
  )
}

export const prepareExport = async (storage, { flat = false } = {}) => {
  const qnas = await storage.fetchAllQuestions()

  return _.flatMap(qnas, question => {
    const { data } = question
    const { questions, answer: textAnswer, action, redirectNode, redirectFlow, category } = data

    let answer = textAnswer
    let answer2 = undefined

    if (action === 'redirect') {
      answer = redirectFlow
      if (redirectNode) {
        answer += '#' + redirectNode
      }
    } else if (action === 'text_redirect') {
      answer2 = redirectFlow
      if (redirectNode) {
        answer2 += '#' + redirectNode
      }
    }
    const categoryWrapper = storage.getCategories() ? { category } : {}

    if (!flat) {
      return { questions, action, answer, answer2, ...categoryWrapper }
    }
    return questions.map(question => ({ question, action, answer, answer2, ...categoryWrapper }))
  })
}

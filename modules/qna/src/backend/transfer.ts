import _ from 'lodash'

import * as parsers from './parsers.js'

const ANSWERS_SPLIT_CHAR = '†'

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
  return Promise.each(questionsToSave, async question => {
    const answers = question['answer'].split(ANSWERS_SPLIT_CHAR)
    await storage.insert({ ...question, answers, enabled: true })
    questionsSavedCount += 1
    statusCallback(uploadStatusId, `Saved ${questionsSavedCount}/${questionsToSave.length} questions`)
  })
}

export const prepareExport = async (storage, { flat = false } = {}) => {
  const qnas = await storage.fetchAllQuestions()

  return _.flatMap(qnas, question => {
    const { data } = question
    const { questions, action, redirectNode, redirectFlow, category, answers, answer: textAnswer } = data

    // FIXME: Remove v11.2 answer support
    let answer = answers.join(ANSWERS_SPLIT_CHAR) || textAnswer // textAnswer allow to support v11.2 answer format
    let answer2 = undefined

    // FIXME: Refactor these answer, answer2 fieds for something more meaningful like a 'redirect' field.
    // redirect dont need text so answer is overriden with the redirect flow
    if (action === 'redirect') {
      answer = redirectFlow
      if (redirectNode) {
        answer += '#' + redirectNode
      }
      // text_redirect will display a text before redirecting to the desired flow
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

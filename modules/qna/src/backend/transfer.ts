import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import * as parsers from './parsers.js'

const ANSWERS_SPLIT_CHAR = '†'

export const prepareImport = async (questions, bp: typeof sdk, params) => {
  const { storage, format = 'json', statusCallback, uploadStatusId, isReplace } = params

  statusCallback(uploadStatusId, 'Calculating diff with existing questions')

  const existingQuestions = (await storage.fetchAllQuestions()).map(item =>
    JSON.stringify(_.omit(item.data, 'enabled'))
  )

  const hasCategory = storage.hasCategories()
  const parsedQuestions =
    typeof questions === 'string' ? parsers[`${format}Parse`](questions, { hasCategory }) : questions
  const questionsToSave = parsedQuestions.filter(item => !existingQuestions.includes(JSON.stringify(item)))

  !isReplace && (await storage.checkForDuplicatedQuestions(_.flatMap(questionsToSave, question => question.questions)))

  const contentTypesList = (await bp.cms.getAllContentTypes(storage.botId)).map(contentType => contentType.id)

  function parseAnswer(answer, questionIndex, answerIndex) {
    if (answer.startsWith('{')) {
      try {
        const parsedAnswer = JSON.parse(answer)
        // Checks if the bot has the contentType
        if (!contentTypesList.includes(parsedAnswer.contentType)) {
          throw new Error(`Content Type not found (${parsedAnswer.contentType})`)
        }
        return parsedAnswer
      } catch (e) {
        throw new Error(
          `Error parsing content Element from answer ${answerIndex + 1} at line ${questionIndex + 2}: ${e.message}`
        )
      }
    }
    return answer
  }

  // Parse answers and return questions
  return questionsToSave.map((question, questionIndex) => {
    const { questions, action, redirectFlow, redirectNode, category, answer } = question
    return {
      questions,
      action,
      redirectFlow,
      redirectNode,
      category,
      answers: answer
        .split(ANSWERS_SPLIT_CHAR)
        .map((answer, answerIndex) => parseAnswer(answer, questionIndex, answerIndex))
    }
  })
}

export const importQuestions = async (questions, bp: typeof sdk, params) => {
  const { storage, config, statusCallback, uploadStatusId } = params

  if (config.qnaMakerApiKey) {
    return storage.insert(questions.map(question => ({ ...question, enabled: true })))
  }

  let questionsSavedCount = 0
  return Promise.each(questions, async (question: any) => {
    const createContentElementsFromAnswers = async answer => {
      if (answer.formData) {
        const contentId = await bp.cms.createOrUpdateContentElement(storage.botId, answer.contentType, answer.formData)
        return { contentId }
      }
      return answer
    }
    const answers = await Promise.all(await _.flatMap(question.answers, createContentElementsFromAnswers))
    await storage.insert({ ...question, answers, enabled: true })
    questionsSavedCount += 1
    statusCallback(uploadStatusId, `Saved ${questionsSavedCount}/${questions.length} questions`)
  })
}

export const prepareExport = async (storage, bp: typeof sdk, { flat = false } = {}) => {
  const qnas = await storage.fetchAllQuestions()

  const promisses: any[] = await Promise.all(
    await _.flatMap(qnas, async question => {
      const { data } = question
      const { questions, action, redirectNode, redirectFlow, category, answers, answer: textAnswer } = data

      // Will get formData and contentType from contentElement so it can be exported as well
      for (let answer of answers) {
        if (typeof answer != 'string') {
          const { formData, contentType } = await bp.cms.getContentElement(storage.botId, answer.contentId)
          answer['formData'] = formData
          answer['contentType'] = contentType
        }
      }

      // FIXME: Remove v11.2 answer support
      let answer =
        answers
          .map(answer => (typeof answer == 'string' ? answer : JSON.stringify(answer))) // stringfy contents
          .join(ANSWERS_SPLIT_CHAR) || textAnswer // textAnswer allow to support v11.2 answer format
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
  )
  return _.flatten(promisses)
}

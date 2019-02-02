import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { NLU_PREFIX } from './providers/nlu'
import NluStorage from './providers/nlu'
import MicrosoftQnaMakerStorage from './providers/qnaMaker'
import { QnaStorage } from './qna'

export const initBot = async (bp: typeof sdk, botScopedStorage: Map<string, QnaStorage>, botId: string) => {
  const config = await bp.config.getModuleConfigForBot('qna', botId)

  let storage = undefined
  if (config.qnaMakerApiKey) {
    storage = new MicrosoftQnaMakerStorage(bp, config)
  } else {
    storage = new NluStorage(bp, config, botId)
  }

  await storage.initialize()
  botScopedStorage.set(botId, storage)
}

export const initModule = async (bp: typeof sdk, botScopedStorage: Map<string, QnaStorage>) => {
  bp.events.registerMiddleware({
    name: 'qna.incoming',
    direction: 'incoming',
    handler: async (event: sdk.IO.IncomingEvent, next) => {
      if (!event.hasFlag(bp.IO.WellKnownFlags.SKIP_QNA_PROCESSING)) {
        const config = await bp.config.getModuleConfigForBot('qna', event.botId)
        const storage = botScopedStorage.get(event.botId)

        await processEvent(event, { bp, storage, config })
        next()
      }
    },
    order: 11, // must be after the NLU middleware and before the dialog middleware
    description: 'Listen for predefined questions and send canned responses.'
  })

  const getAlternativeAnswer = question => {
    const randomIndex = Math.floor(Math.random() * question.answers.length)
    return question.answers[randomIndex]
  }

  const buildSuggestions = async (event, question, confidence, intent, renderer): Promise<sdk.IO.Suggestion> => {
    const payloads = []

    if (question.action.includes('text')) {
      const args = {
        user: _.get(event, 'state.user') || {},
        session: _.get(event, 'state.session') || {},
        temp: _.get(event, 'state.temp') || {},
        text: getAlternativeAnswer(question),
        typing: true
      }

      const element = await bp.cms.renderElement(renderer, args, {
        botId: event.botId,
        channel: event.channel,
        target: event.target,
        threadId: event.threadId
      })

      payloads.push(...element)
    }

    if (question.action.includes('redirect')) {
      payloads.push({ type: 'redirect', flow: question.redirectFlow, node: question.redirectNode })
    }

    return <sdk.IO.Suggestion>{
      confidence,
      payloads,
      source: 'qna',
      sourceDetails: intent
    }
  }

  const getQuestionForIntent = async (storage, intentName) => {
    if (intentName && intentName.startsWith(NLU_PREFIX)) {
      const qnaId = intentName.substring(NLU_PREFIX.length)
      return (await storage.getQuestion(qnaId)).data
    }
  }

  const processEvent = async (event: sdk.IO.IncomingEvent, { bp, storage, config }) => {
    if (config.qnaMakerApiKey) {
      const qnaQuestion = (await storage.answersOn(event.preview)).pop()

      if (qnaQuestion && qnaQuestion.enabled) {
        event.suggestions.push(
          await buildSuggestions(event, qnaQuestion, qnaQuestion.confidence, undefined, config.textRenderer)
        )
      }

      return
    }

    if (!event.nlu || !event.nlu.intents) {
      return
    }

    for (const intent of event.nlu.intents) {
      const question = await getQuestionForIntent(storage, intent.name)
      if (question && question.enabled) {
        event.suggestions.push(
          await buildSuggestions(event, question, intent.confidence, intent.name, config.textRenderer)
        )
      }
    }
  }
}

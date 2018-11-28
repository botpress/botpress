import { NLU_PREFIX } from './providers/nlu'
import NluStorage from './providers/nlu'
import MicrosoftQnaMakerStorage from './providers/qnaMaker'
import { QnaStorage, SDK } from './qna'

export const initBot = async (bp: SDK, botScopedStorage: Map<string, QnaStorage>, botId: string) => {
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

export const initModule = async (bp: SDK, botScopedStorage: Map<string, QnaStorage>) => {
  bp.events.registerMiddleware({
    name: 'qna.incoming',
    direction: 'incoming',
    handler: async (event, next) => {
      if (!event.hasFlag(bp.IO.WellKnownFlags.SKIP_QNA_PROCESSING)) {
        const config = bp.config.getModuleConfigForBot('qna', event.botId)
        const storage = botScopedStorage.get(event.botId)

        await processEvent(event, { bp, storage, config })
        next()
      }
    },
    order: 11, // must be after the NLU middleware and before the dialog middleware
    description: 'Listen for predefined questions and send canned responses.'
  })

  const buildSuggestedReply = async (event, question, confidence, intent) => {
    const payloads = []
    if (question.action.includes('text')) {
      const element = await bp.cms.renderElement(
        'builtin_text',
        { text: question.answer, typing: true },
        {
          botId: event.botId,
          channel: event.channel,
          target: event.target,
          threadId: event.threadId
        }
      )
      payloads.push(...element)
    }

    if (question.action.includes('redirect')) {
      payloads.push({ type: 'redirect', flow: question.redirectFlow, node: question.redirectNode })
    }

    return {
      confidence,
      payloads,
      intent
    }
  }

  const getQuestionForIntent = async (storage, intentName) => {
    if (intentName && intentName.startsWith(NLU_PREFIX)) {
      const qnaId = intentName.substring(NLU_PREFIX.length)
      return (await storage.getQuestion(qnaId)).data
    }
  }

  const processEvent = async (event, { bp, storage, config }) => {
    if (config.qnaMakerApiKey) {
      const qnaQuestion = (await storage.answersOn(event.text)).pop()

      if (qnaQuestion && qnaQuestion.enabled) {
        event.suggestedReplies.push(await buildSuggestedReply(event, qnaQuestion, qnaQuestion.confidence, undefined))
      }

      return
    }

    if (!event.nlu || !event.nlu.intents) {
      return
    }

    for (const intent of event.nlu.intents) {
      const question = await getQuestionForIntent(storage, intent.name)
      if (question && question.enabled) {
        event.suggestedReplies.push(await buildSuggestedReply(event, question, intent.confidence, intent.name))
      }
    }
  }
}

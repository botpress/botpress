import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { QnaEntry } from './qna'
import Storage, { NLU_PREFIX } from './storage'
import NluStorage from './storage'

export const initBot = async (bp: typeof sdk, botScopedStorage: Map<string, Storage>, botId: string) => {
  const config = await bp.config.getModuleConfigForBot('qna', botId)
  const storage = new NluStorage(bp, config, botId)

  await storage.initialize()
  botScopedStorage.set(botId, storage)
}

export const initModule = async (bp: typeof sdk, botScopedStorage: Map<string, Storage>) => {
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

  const getAlternativeAnswer = (qnaEntry: QnaEntry, lang: string) => {
    const randomIndex = Math.floor(Math.random() * qnaEntry.answers[lang].length)
    return qnaEntry.answers[lang][randomIndex]
  }

  const buildSuggestions = async (
    event: sdk.IO.IncomingEvent,
    qnaEntry: QnaEntry,
    confidence,
    intent,
    renderer
  ): Promise<sdk.IO.Suggestion> => {
    const payloads = []

    let lang = event.nlu.language
    if (lang === 'n/a') {
      lang = (await bp.bots.getBotById(event.botId)).defaultLanguage
    }

    if (qnaEntry.action.includes('text')) {
      const args = {
        user: _.get(event, 'state.user') || {},
        session: _.get(event, 'state.session') || {},
        temp: _.get(event, 'state.temp') || {},
        text: getAlternativeAnswer(qnaEntry, lang),
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

    if (qnaEntry.action.includes('redirect')) {
      payloads.push({ type: 'redirect', flow: qnaEntry.redirectFlow, node: qnaEntry.redirectNode })
    }

    return <sdk.IO.Suggestion>{
      confidence,
      payloads,
      source: 'qna',
      sourceDetails: intent
    }
  }

  const getQuestionForIntent = async (storage: Storage, intentName) => {
    if (intentName && intentName.startsWith(NLU_PREFIX)) {
      const qnaId = intentName.substring(NLU_PREFIX.length)
      return (await storage.getQnaItem(qnaId)).data
    }
  }

  const processEvent = async (event: sdk.IO.IncomingEvent, { bp, storage, config }) => {
    if (!event.nlu || !event.nlu.intents) {
      return
    }

    for (const intent of event.nlu.intents) {
      const qnaEntry = await getQuestionForIntent(storage, intent.name)
      if (qnaEntry && qnaEntry.enabled) {
        event.suggestions.push(
          await buildSuggestions(event, qnaEntry, intent.confidence, intent.name, config.textRenderer)
        )
      }
    }
  }
}

import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { QnaEntry, ScopedBots } from './qna'
import NluStorage from './storage'
import { getQnaEntryPayloads, getQuestionForIntent } from './utils'

export const initBot = async (bp: typeof sdk, botId: string, bots: ScopedBots) => {
  const config = await bp.config.getModuleConfigForBot('qna', botId)
  const defaultLang = (await bp.bots.getBotById(botId)).defaultLanguage

  const storage = new NluStorage(bp, config, botId)
  await storage.initialize()

  bots[botId] = { storage, config, defaultLang }
}

export const initModule = async (bp: typeof sdk, bots: ScopedBots) => {
  bp.events.registerMiddleware({
    name: 'qna.incoming',
    direction: 'incoming',
    handler: async (event: sdk.IO.IncomingEvent, next) => {
      if (!event.hasFlag(bp.IO.WellKnownFlags.SKIP_QNA_PROCESSING)) {
        const botInfo = bots[event.botId]
        if (botInfo) {
          await processEvent(event, botInfo)
        }
        next()
      }
    },
    order: 130, // must be after the NLU middleware and before the dialog middleware
    description: 'Listen for predefined questions and send canned responses.'
  })

  const buildSuggestions = async (
    event: sdk.IO.IncomingEvent,
    qnaEntry: QnaEntry,
    confidence,
    intent,
    renderer,
    defaultLang
  ): Promise<sdk.IO.Suggestion> => {
    const payloads = []

    if (qnaEntry.action.includes('text')) {
      payloads.push(...(await getQnaEntryPayloads(qnaEntry, event, renderer, defaultLang, bp)))
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

  const processEvent = async (event: sdk.IO.IncomingEvent, { storage, config, defaultLang }) => {
    if (!event.nlu || !event.nlu.intents || event.ndu) {
      return
    }

    for (const intent of event.nlu.intents) {
      const qnaEntry = await getQuestionForIntent(storage, intent.name)
      if (qnaEntry && qnaEntry.enabled) {
        event.suggestions.push(
          await buildSuggestions(event, qnaEntry, intent.confidence, intent.name, config.textRenderer, defaultLang)
        )
      }
    }
  }
}

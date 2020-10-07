import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { ScopedBots } from './qna'
import Storage from './storage'
import { getQnaEntryPayloads } from './utils'

export const NLU_PREFIX = '__qna__'

export const initModule = async (bp: typeof sdk, bots: ScopedBots) => {
  bp.events.registerMiddleware({
    name: 'qna.incoming',
    direction: 'incoming',
    handler: async (event: sdk.IO.IncomingEvent, next) => {
      if (!event.hasFlag(bp.IO.WellKnownFlags.SKIP_QNA_PROCESSING)) {
        await processEvent(event, bots[event.botId])
        next()
      }
    },
    order: 140, // must be after the NLU middleware and before the dialog middleware
    description: 'Listen for predefined questions and send canned responses.'
  })

  const buildSuggestions = async (
    event: sdk.IO.IncomingEvent,
    qnaEntry: any,
    confidence,
    intent,
    renderer,
    defaultLang
  ): Promise<sdk.IO.Suggestion> => {
    const payloads = []

    if (qnaEntry.action.includes('text')) {
      payloads.push(...(await getQnaEntryPayloads(qnaEntry, defaultLang, defaultLang)))
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
      return await storage.getQnaItem(intentName)
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

export const initBot = async (bp: typeof sdk, botId: string, bots: ScopedBots) => {
  const config = await bp.config.getModuleConfigForBot('qna', botId)
  const defaultLang = (await bp.bots.getBotById(botId)).defaultLanguage
  const storage = new Storage(bp.ghost.forBot(botId))
  bots[botId] = { storage, config, defaultLang }
}

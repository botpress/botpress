import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { ScopedBots } from './qna'
import StorageLegacy from './storage_legacy'
import { getQnaEntryPayloadsLegacy } from './utils_legacy'

export const NLU_PREFIX = '__qna__'

export const initModule = async (bp: typeof sdk, bots: ScopedBots) => {
  bp.events.registerMiddleware({
    name: 'qna.incoming',
    direction: 'incoming',
    handler: async (event: sdk.IO.IncomingEvent, next) => {
      const bot = bots[event.botId]
      if (!bot?.isLegacy || event.hasFlag(bp.IO.WellKnownFlags.SKIP_QNA_PROCESSING)) {
        return next(undefined, undefined, true)
      }

      await processEvent(event, bot)
      next()
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
      payloads.push(...(await getQnaEntryPayloadsLegacy(qnaEntry, event, renderer, defaultLang, bp)))
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

  const getQuestionForIntent = async (storage: StorageLegacy, intentName) => {
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

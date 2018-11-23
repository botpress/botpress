import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import util from 'util'

import ScopedEngine from './engine'

export const registerMiddleware = async (bp: typeof sdk, botScopedNlu: EngineByBot) => {
  bp.events.registerMiddleware({
    name: 'nlu.incoming',
    direction: 'incoming',
    handler: async (event: sdk.IO.Event, next: sdk.IO.MiddlewareNextCallback) => {
      await processEvent(event)
      next()
    },
    order: 10,
    description:
      'Process natural language in the form of text. Structured data with an action and parameters for that action is injected in the incoming message event.'
  })

  async function processEvent(event) {
    if (['session_reset', 'bp_dialog_timeout', 'visit'].includes(event.type)) {
      return
    }

    const botCtx = botScopedNlu[event.botId] as ScopedEngine

    if (!botCtx) {
      return
    }

    let eventIntent = { confidence: undefined, name: undefined }
    let eventIntents = []

    try {
      const metadata = await botCtx.extract(event)

      if (metadata) {
        Object.assign(event, { nlu: metadata })
        eventIntent = metadata.intent
        eventIntents = metadata.intents

        // if (botCtx.config.debugModeEnabled) {
        //   const debugCtx = {
        //     text: event.preview,
        //     intent: eventIntent && eventIntent.name,
        //     confidence: eventIntent && eventIntent.confidence,
        //     bot_min_confidence: botCtx.minConfidence,
        //     bot_max_confidence: botCtx.maxConfidence,
        //     is_confident_enough:
        //       eventIntent &&
        //       eventIntent.confidence >= botCtx.minConfidence &&
        //       eventIntent.confidence <= botCtx.maxConfidence,
        //     language: metadata.language || 'N/A',
        //     entities: metadata.entities || []
        //   }
        //   const debugStr = util.inspect(debugCtx, { colors: true, depth: 2 })
        //   bp.logger.debug('NLU Extraction ' + debugStr)
        // }
      }
    } catch (err) {
      bp.logger.warn('Error extracting metadata for incoming text: ' + err.message)
    }

    const intentConfidentEnough = () => {
      const confidence = eventIntent.confidence != undefined ? eventIntent.confidence : 1
      return confidence >= botCtx.minConfidence && confidence <= botCtx.maxConfidence
    }

    if (event.nlu) {
      Object.assign(event.nlu.intent, {
        intentConfidentEnough,
        is: intentName => {
          intentName = (intentName || '').toLowerCase()
          return intentConfidentEnough() && (eventIntent.name || '').toLowerCase() === intentName
        },
        startsWith: prefix => {
          prefix = (prefix || '').toLowerCase()
          return intentConfidentEnough() && (eventIntent.name || '').toLowerCase().startsWith(prefix)
        }
      })
      Object.assign(event.nlu.intents, {
        has: intentName => {
          intentName = (intentName || '').toLowerCase()
          return !!eventIntents.find(intent => (intent.name || '').toLowerCase() === intentName)
        }
      })
    }
  }
}

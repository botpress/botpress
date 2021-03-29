import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { NLUApplication } from './application'
import legacyElectionPipeline from './election/legacy-election'

const EVENTS_TO_IGNORE = ['session_reference', 'session_reset', 'bp_dialog_timeout', 'visit', 'say_something', '']

const PREDICT_MW = 'nlu-predict.incoming'
const ELECT_MW = 'nlu-elect.incoming'

const _ignoreEvent = (bp: typeof sdk, app: NLUApplication, event: sdk.IO.IncomingEvent) => {
  const health = app.getHealth()
  return (
    !app.hasBot(event.botId) ||
    !health.isEnabled ||
    !event.preview ||
    EVENTS_TO_IGNORE.includes(event.type) ||
    event.hasFlag(bp.IO.WellKnownFlags.SKIP_NATIVE_NLU)
  )
}

const removeSensitiveText = (bp: typeof sdk, event: sdk.IO.IncomingEvent) => {
  if (!event.nlu || !event.nlu.entities || !event.payload.text) {
    return
  }

  try {
    const sensitiveEntities = event.nlu.entities.filter(ent => ent.meta.sensitive)
    for (const entity of sensitiveEntities) {
      const stars = '*'.repeat(entity.data.value.length)
      event.payload.text = event.payload.text.replace(entity.data.value, stars)
    }
  } catch (err) {
    bp.logger.warn(`Error removing sensitive information: ${err.message}`)
  }
}

export const registerMiddlewares = (bp: typeof sdk, app: NLUApplication) => {
  bp.events.registerMiddleware({
    name: PREDICT_MW,
    direction: 'incoming',
    order: 100,
    description:
      'Process natural language in the form of text. Structured data with an action and parameters for that action is injected in the incoming message event.',
    handler: async (event: sdk.IO.IncomingEvent, next: sdk.IO.MiddlewareNextCallback) => {
      if (_ignoreEvent(bp, app, event)) {
        return next(undefined, false, true)
      }

      try {
        const { botId, preview } = event
        const anticipatedLanguage: string | undefined = event.state.user?.language

        const bot = app.getBot(botId)
        const nluResults = await bot.predict(preview, anticipatedLanguage)
        const nlu = { ...nluResults, includedContexts: event.nlu?.includedContexts ?? [] }
        _.merge(event, { nlu })
        removeSensitiveText(bp, event)
      } catch (err) {
        bp.logger.warn(`Error extracting metadata for incoming text: ${err.message}`)
      } finally {
        next()
      }
    }
  })

  bp.events.registerMiddleware({
    name: ELECT_MW,
    direction: 'incoming',
    order: 120,
    description: 'Perform intent election for the outputed NLU.',
    handler: async (event: sdk.IO.IncomingEvent, next: sdk.IO.MiddlewareNextCallback) => {
      if (_ignoreEvent(bp, app, event) || !event.nlu) {
        return next()
      }

      try {
        // TODO: use the 'intent-is' condition logic when bot uses NDU
        const nlu = legacyElectionPipeline(event.nlu)
        _.merge(event, { nlu })
      } catch (err) {
        bp.logger.warn(`Error making nlu election for incoming text: ${err.message}`)
      } finally {
        next()
      }
    }
  })
}

export const removeMiddlewares = async (bp: typeof sdk) => {
  bp.events.removeMiddleware(PREDICT_MW)
  bp.events.removeMiddleware(ELECT_MW)
}

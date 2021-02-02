import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { NLUApplication } from './application'
import legacyElectionPipeline from './election/legacy-election'
import { ScopedPredictionHandler } from './prediction-handler'
import { NLUState } from './typings'

const EVENTS_TO_IGNORE = ['session_reference', 'session_reset', 'bp_dialog_timeout', 'visit', 'say_something', '']

const PREDICT_MW = 'nlu-predict.incoming'
const ELECT_MW = 'nlu-elect.incoming'

const _ignoreEvent = (bp: typeof sdk, state: NLUState, event: sdk.IO.IncomingEvent) => {
  const { application, engine } = state
  const health = engine.getHealth()
  return (
    !application.hasBot(event.botId) ||
    !health.isEnabled ||
    !event.preview ||
    EVENTS_TO_IGNORE.includes(event.type) ||
    event.hasFlag(bp.IO.WellKnownFlags.SKIP_NATIVE_NLU)
  )
}

export const registerMiddlewares = (bp: typeof sdk, state: NLUState) => {
  const { application, engine } = state

  bp.events.registerMiddleware({
    name: PREDICT_MW,
    direction: 'incoming',
    order: 100,
    description:
      'Process natural language in the form of text. Structured data with an action and parameters for that action is injected in the incoming message event.',
    handler: async (event: sdk.IO.IncomingEvent, next: sdk.IO.MiddlewareNextCallback) => {
      if (_ignoreEvent(bp, state, event)) {
        return next(undefined, false, true)
      }

      try {
        const { botId, preview } = event
        const anticipatedLanguage = event.state.user?.language
        const nluResults = await application.predict(botId, preview, anticipatedLanguage)
        const nlu = { ...nluResults, includedContexts: event.nlu?.includedContexts ?? [] }
        _.merge(event, { nlu })
        removeSensitiveText(event)
      } catch (err) {
        bp.logger.warn(`Error extracting metadata for incoming text: ${err.message}`)
      } finally {
        next()
      }
    }
  })

  function removeSensitiveText(event: sdk.IO.IncomingEvent) {
    if (!event.nlu.entities || !event.payload.text) {
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

  bp.events.registerMiddleware({
    name: ELECT_MW,
    direction: 'incoming',
    order: 120,
    description: 'Perform intent election for the outputed NLU.',
    handler: async (event: sdk.IO.IncomingEvent, next: sdk.IO.MiddlewareNextCallback) => {
      if (_ignoreEvent(bp, state, event) || !event.nlu) {
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

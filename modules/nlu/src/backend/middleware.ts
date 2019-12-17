import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import yn from 'yn'

import { nluHealth } from '.'
import ScopedEngine from './engine'
import Engine2, { E2ByBot } from './engine2/engine2'
import { EngineByBot } from './typings'

const USE_E1 = yn(process.env.USE_LEGACY_NLU)
const EVENTS_TO_IGNORE = ['session_reference', 'session_reset', 'bp_dialog_timeout', 'visit', 'say_something', '']

export const registerMiddleware = async (bp: typeof sdk, e1ByBot: EngineByBot, e2byBot: E2ByBot) => {
  bp.events.registerMiddleware({
    name: 'nlu.incoming',
    direction: 'incoming',
    order: 10,
    description:
      'Process natural language in the form of text. Structured data with an action and parameters for that action is injected in the incoming message event.',
    handler: async (event: sdk.IO.IncomingEvent, next: sdk.IO.MiddlewareNextCallback) => {
      if (!nluHealth.isEnabled) {
        return next()
      }

      const botCtx = USE_E1 ? (e1ByBot[event.botId] as ScopedEngine) : e2byBot[event.botId]

      if (
        !botCtx ||
        !event.preview ||
        EVENTS_TO_IGNORE.includes(event.type) ||
        event.hasFlag(bp.IO.WellKnownFlags.SKIP_NATIVE_NLU)
      ) {
        return next()
      }

      try {
        let nlu = {}
        if (USE_E1) {
          nlu = await (botCtx as ScopedEngine).extract!(
            event.preview,
            event.state.session.lastMessages.map(message => message.incomingPreview),
            event.nlu.includedContexts
          )
        } else {
          nlu = await (botCtx as Engine2).predict(event.preview, event.nlu.includedContexts)
        }

        _.merge(event, { nlu })
        removeSensitiveText(event)
      } catch (err) {
        bp.logger.warn('Error extracting metadata for incoming text: ' + err.message)
      } finally {
        next()
      }
    }
  })

  function removeSensitiveText(event) {
    if (!event.nlu.entities || !event.payload.text) {
      return
    }

    try {
      const sensitiveEntities = event.nlu.entities.filter(ent => ent.sensitive)
      for (const entity of sensitiveEntities) {
        const stars = '*'.repeat(entity.data.value.length)
        event.payload.text = event.payload.text.replace(entity.data.value, stars)
      }
    } catch (err) {
      bp.logger.warn('Error removing sensitive information: ' + err.message)
    }
  }
}

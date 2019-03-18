import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import ScopedEngine from './engine'
import { EngineByBot } from './typings'

const EVENTS_TO_IGNORE = ['session_reset', 'bp_dialog_timeout', 'visit']

export const registerMiddleware = async (bp: typeof sdk, botScopedNlu: EngineByBot) => {
  bp.events.registerMiddleware({
    name: 'nlu.incoming',
    direction: 'incoming',
    order: 10,
    description:
      'Process natural language in the form of text. Structured data with an action and parameters for that action is injected in the incoming message event.',
    handler: async (event: sdk.IO.IncomingEvent, next: sdk.IO.MiddlewareNextCallback) => {
      const botCtx = botScopedNlu[event.botId] as ScopedEngine

      if (
        !botCtx ||
        !event.preview ||
        EVENTS_TO_IGNORE.includes(event.type) ||
        event.hasFlag(bp.IO.WellKnownFlags.SKIP_NATIVE_NLU)
      ) {
        return next()
      }

      try {
        const metadata = await botCtx.extract(event.preview, event.nlu.includedContexts)
        _.merge(event, { nlu: metadata })
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
      bp.logger.warn('Error removing sensitive informations: ' + err.message)
    }
  }
}

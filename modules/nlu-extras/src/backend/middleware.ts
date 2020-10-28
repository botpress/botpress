import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { Config } from '../config'

import { predict } from './engines/dialogflow'

const configPerBot: { [botId: string]: Config } = {}

export const enableForBot = (botId: string, config: Config) => {
  configPerBot[botId] = config
}

export const removeForBot = botId => delete configPerBot[botId]

export const registerMiddleware = async (bp: typeof sdk) => {
  bp.events.registerMiddleware({
    name: 'nlu-extras.incoming',
    direction: 'incoming',
    order: 129,
    description:
      'Process natural language in the form of text. Structured data with an action and parameters for that action is injected in the incoming message event.',
    handler: async (event: sdk.IO.IncomingEvent, next: sdk.IO.MiddlewareNextCallback) => {
      const config = configPerBot[event.botId]
      const enabled = config && config.dialogflow && config.dialogflow.enabled

      if (!enabled || !event.preview || event.hasFlag(bp.IO.WellKnownFlags.SKIP_NATIVE_NLU)) {
        return next()
      }

      try {
        const result = await predict(config.dialogflow, event.preview, event.nlu.language, event.nlu.includedContexts)

        if (config.primary === 'dialogflow-nlu') {
          event.nlu['engine'] = 'dialogflow'
          event.nlu['botpress-nlu'] = _.cloneDeep(event.nlu)
          event.nlu.intent.name = result.intent
          event.nlu.intent.confidence = result.confidence
          Object.assign(event.nlu, { intents: [event.nlu.intent] })
          Object.assign(event.nlu.slots, result.slots)
        } else {
          event.nlu['engine'] = 'botpress'
          event.nlu['dialogflow-nlu'] = { ...result, engine: 'dialogflow' }
        }
      } catch (err) {
        bp.logger.warn(`Error extracting NLU from Dialogflow: ${err.message}`)
      } finally {
        next()
      }
    }
  })
}

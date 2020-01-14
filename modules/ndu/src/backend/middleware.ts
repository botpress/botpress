import * as sdk from 'botpress/sdk'

import { UnderstandingEngine } from './ndu-engine'
import { BotStorage } from './typings'

export const registerMiddleware = async (bp: typeof sdk, nduEngine: UnderstandingEngine, bots: BotStorage) => {
  bp.events.registerMiddleware({
    name: 'ndu.incoming',
    direction: 'incoming',
    order: 13,
    description: 'Where magic happens',
    handler: async (event: sdk.IO.IncomingEvent, next: sdk.IO.MiddlewareNextCallback) => {
      if (bots[event.botId]) {
        await nduEngine.processEvent(event)
      }

      next()
    }
  })
}

import * as sdk from 'botpress/sdk'

import { MountedBots } from './typings'

export const registerMiddleware = async (bp: typeof sdk, bots: MountedBots) => {
  bp.events.registerMiddleware({
    name: 'ndu.incoming',
    direction: 'incoming',
    order: 13,
    description: 'Where magic happens',
    handler: async (event: sdk.IO.IncomingEvent, next: sdk.IO.MiddlewareNextCallback) => {
      if (bots[event.botId]) {
        await bots[event.botId].processEvent(event)
      }

      next()
    }
  })
}

import * as sdk from 'botpress/sdk'

import { MODULE_NAME, WEBSOCKET_TOPIC } from '../constants'
import { ISocketMessage } from '../types'

const debug = DEBUG(MODULE_NAME)

export default (bp: typeof sdk) => {
  return {
    sendPayload: (botId: string, message: ISocketMessage) => {
      debug.forBot(botId, 'Sending message', { message })
      bp.realtime.sendPayload(new bp.RealTimePayload(`${WEBSOCKET_TOPIC}:${botId}`, message))
    }
  }
}

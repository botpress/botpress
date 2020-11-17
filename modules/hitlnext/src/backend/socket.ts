import * as sdk from 'botpress/sdk'

import { ISocketMessage } from '../types'
import { WEBSOCKET_TOPIC } from './../constants'

const debug = DEBUG('hitlnext').sub('realtime')

export default (bp: typeof sdk) => {
  return {
    sendPayload: (botId: string, message: ISocketMessage) => {
      debug.forBot(botId, 'Sending message', { message })
      bp.realtime.sendPayload(new bp.RealTimePayload(`${WEBSOCKET_TOPIC}:${botId}`, message))
    }
  }
}

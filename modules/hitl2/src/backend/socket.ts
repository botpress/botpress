import * as sdk from 'botpress/sdk'

import { SocketMessageType } from '../types'

const debug = DEBUG('hitl2').sub('realtime')

export default (bp: typeof sdk) => {
  return {
    sendPayload: (message: SocketMessageType) => {
      debug('Sending message', { message })
      bp.realtime.sendPayload(new bp.RealTimePayload('hitl2', message))
    }
  }
}

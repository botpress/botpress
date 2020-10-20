import * as sdk from 'botpress/sdk'
import { SocketMessageType } from '../types'

export default (bp: typeof sdk) => {
  return {
    sendPayload: (message: SocketMessageType) => {
      bp.realtime.sendPayload(new bp.RealTimePayload('hitl2', message))
    }
  }
}

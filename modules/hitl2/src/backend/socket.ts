import * as sdk from 'botpress/sdk'

interface MessageType {
  payload: {}
  resource: string
  type: string
  id: string
}

export default (bp: typeof sdk) => {
  return {
    send: (message: MessageType) => {
      bp.realtime.sendPayload(new bp.RealTimePayload('hitl2', message))
    }
  }
}

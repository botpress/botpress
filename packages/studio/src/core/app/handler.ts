export enum StudioMessage {
  INVALIDATE_FILE = 'INVALIDATE_FILE',
  UPDATE_TOKEN_VERSION = 'UPDATE_TOKEN_VERSION',
  ON_MODULE_EVENT = 'ON_MODULE_EVENT',
  NOTIFY_FLOW_CHANGE = 'NOTIFY_FLOW_CHANGE',
  SET_BOT_MOUNT_STATUS = 'SET_BOT_MOUNT_STATUS'
}

const msgHandlers: { [messageType: string]: (message: any) => void } = {}

export const registerMsgHandler = (messageType: string, handler: (message: any) => void) => {
  msgHandlers[messageType] = handler
}

export const coreActions = {
  invalidateFile: (key: string) => {
    process.send?.({ type: StudioMessage.INVALIDATE_FILE, source: 'studio', key })
  },
  onModuleEvent: (
    eventType: 'onFlowChanged' | 'onFlowRenamed' | 'onElementChanged' | 'onTopicChanged',
    payload: any
  ) => {
    process.send?.({ type: StudioMessage.ON_MODULE_EVENT, eventType, payload })
  },
  notifyFlowChanges: payload => {
    process.send?.({ type: StudioMessage.NOTIFY_FLOW_CHANGE, payload })
  }
}

process.on('message', message => {
  const handler = msgHandlers[message.type]
  if (!handler) {
    return console.error(`No handler configured for ${message.type}`)
  }

  try {
    handler(message)
  } catch (err) {
    console.error(`Error while processing worker message ${message.type}`)
  }
})

import * as chat from '../gen/models/Message.t'
import * as types from '../types'
import * as bp from '.botpress'

export type ChatMessage = {
  payload: chat.Message['payload']
}

export type BotpressMessage = types.ValueOf<{
  [MessageType in keyof bp.channels.channel.Messages]: {
    type: MessageType
    payload: bp.channels.channel.Messages[MessageType]
  }
}>

export const mapBotpressMessageToChat = (message: BotpressMessage): ChatMessage => {
  if (message.type !== 'bloc') {
    return {
      payload: {
        type: message.type,
        ...message.payload,
      },
    } as ChatMessage
  }

  const items = message.payload.items.map((item) => ({
    type: item.type,
    ...item.payload,
  }))

  return {
    payload: {
      type: 'bloc',
      ...message.payload,
      items,
    },
  } as ChatMessage
}

export const mapChatMessageToBotpress = (message: ChatMessage): BotpressMessage => {
  const { payload } = message

  if (payload.type !== 'bloc') {
    const { type, ...payloadData } = payload
    return {
      type,
      payload: payloadData,
    } as BotpressMessage
  }

  return {
    type: payload.type,
    payload: {
      ...payload,
      items: payload.items.map(({ type, ...payload }) => ({
        type,
        payload,
      })),
    },
  } as BotpressMessage
}

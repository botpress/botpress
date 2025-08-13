import * as chat from '../gen/models/Message.t'
import * as types from '../types'
import * as bp from '.botpress'

export type ChatMessage = {
  payload: chat.Message['payload']
  metadata: chat.Message['metadata']
}

export type BotpressMessage = types.ValueOf<{
  [MessageType in keyof bp.channels.channel.Messages]: {
    type: MessageType
    payload: bp.channels.channel.Messages[MessageType]
  }
}>

export const mapBotpressMessageToChat = (message: BotpressMessage): ChatMessage => {
  const { metadata, ...messagePayload } = message.payload
  if (message.type !== 'bloc') {
    return {
      metadata,
      payload: {
        type: message.type,
        ...messagePayload,
      },
    } as ChatMessage
  }

  const items = message.payload.items.map((item) => ({
    type: item.type,
    ...item.payload,
  }))

  return {
    metadata,
    payload: {
      type: 'bloc',
      ...messagePayload,
      items,
    },
  } as ChatMessage
}

export const mapChatMessageToBotpress = (message: ChatMessage): BotpressMessage => {
  const { payload, metadata } = message

  if (payload.type !== 'bloc') {
    const { type, ...payloadData } = payload
    return {
      type,
      payload: { metadata, ...payloadData },
    } as BotpressMessage
  }

  return {
    type: payload.type,
    payload: {
      ...payload,
      metadata,
      items: payload.items.map(({ type, ...payload }) => ({
        type,
        payload,
      })),
    },
  } as BotpressMessage
}

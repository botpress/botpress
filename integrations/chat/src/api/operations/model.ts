import * as types from '../types'

export type ChatConversation = types.OperationOutputs['getConversation']['body']['conversation']
export const mapConversation = (conversation: types.Conversation): ChatConversation => {
  return {
    id: conversation.id,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  }
}

export type ChatUser = types.OperationOutputs['getUser']['body']['user']
export const mapUser = (user: types.User): ChatUser => {
  return {
    id: user.id,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    name: user.name,
    pictureUrl: user.pictureUrl,
    profile: user.tags.profile,
  }
}

export type ChatMessage = types.OperationOutputs['createMessage']['body']['message']
export const mapMessage = (message: types.Message): ChatMessage => {
  const { type } = message
  const { metadata, ...payload } = message.payload
  return {
    id: message.id,
    createdAt: message.createdAt,
    conversationId: message.conversationId,
    userId: message.userId,
    payload: { type, ...payload } as ChatMessage['payload'],
    metadata,
  }
}

export type ChatEvent = types.OperationOutputs['createEvent']['body']['event']
export const mapEvent = (event: types.Event): ChatEvent => {
  const { id, createdAt, payload: data } = event
  const { userId, conversationId, payload } = data
  return {
    id,
    createdAt,
    conversationId,
    userId,
    payload,
  }
}

import { EndConversationReason } from './events/conversation-ended'

export type TriggerPayload = {
  type: string
  transport: {
    key: string
  }
  payload: { messages: { type: MessageTypes; message: Message }[] } | string
}

export type MessageTypes = 'ChatEstablished' | 'ChatRequestFail' | 'ChatRequestSuccess' | 'ChatTransferred' | 'QueueUpdate' | 'ChatMessage' | 'AgentTyping' | 'ChatEnded' | 'AgentNotTyping'

export type Message = ChatEstablishedMessage & ChatRequestFailMessage & ChatRequestSuccessMessage & QueueUpdateMessage & ChatMessageMessage & AgentTypingMessage & ChatEndedMessage & AgentNotTypingMessage

export type ChatEstablishedMessage = { name: string }
export type ChatTransferredMessage = { name: string }
export type ChatRequestFailMessage = { reason: string }
export type ChatRequestSuccessMessage = {  }
export type QueueUpdateMessage = { estimatedWaitTime: number; position: number }
export type ChatMessageMessage = { name: string; text: string }
export type AgentTypingMessage = { }
export type ChatEndedMessage = { reason: string }
export type AgentNotTypingMessage = { }

import type { Message, Conversation, User, Event, Client, State } from '@botpress/client'
import type { BotContext } from './context'

export type MessageHandler = (props: {
  client: Client
  message: Message
  conversation: Conversation
  user: User
  event: Event
  ctx: BotContext
}) => Promise<void>

export type EventHandler = (props: { client: Client; event: Event; ctx: BotContext }) => Promise<void>
export type StateExpiredHandler = (props: { client: Client; state: State; ctx: BotContext }) => Promise<void>

export type RegisterHandler = () => Promise<void>

export type UnregisterHandler = () => Promise<void>

export type BotState = {
  registerHandlers: RegisterHandler[]
  unregisterHandlers: UnregisterHandler[]
  messageHandlers: MessageHandler[]
  eventHandlers: EventHandler[]
  stateExpiredHandlers: StateExpiredHandler[]
}

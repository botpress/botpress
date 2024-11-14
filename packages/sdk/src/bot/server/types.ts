import * as client from '@botpress/client'
import * as utils from '../../utils/type-utils'
import { BotSpecificClient } from '../client'
import * as types from '../types'

export type BotOperation = 'event_received' | 'register' | 'unregister' | 'ping' | 'action_triggered'
export type BotContext = {
  botId: string
  type: string
  operation: BotOperation
  configuration: {
    payload: string
  }
}

export type BotEvent<TBot extends types.BaseBot> = utils.ValueOf<{
  [K in keyof types.EnumerateEvents<TBot>]: utils.Merge<
    client.Event,
    { type: K; payload: types.EnumerateEvents<TBot>[K] }
  >
}>

export type BotMessage<TBot extends types.BaseBot> = utils.ValueOf<{
  // TODO: use bot definiton message property to infer allowed tags
  [K in keyof types.GetMessages<TBot>]: utils.Merge<client.Message, { type: K; payload: types.GetMessages<TBot>[K] }>
}>

export type CommonHandlerProps<TBot extends types.BaseBot> = {
  ctx: BotContext
  client: BotSpecificClient<TBot>
}

export type MessagePayload<TBot extends types.BaseBot> = {
  message: BotMessage<TBot>
  user: client.User
  conversation: client.Conversation
  event: client.Event
  states: {
    [TState in keyof TBot['states']]: {
      type: 'user' | 'conversation' | 'bot'
      payload: TBot['states'][TState]
    }
  }
}
export type MessageHandlerProps<TBot extends types.BaseBot> = CommonHandlerProps<TBot> & MessagePayload<TBot>
export type MessageHandler<TBot extends types.BaseBot> = (args: MessageHandlerProps<TBot>) => Promise<void>

export type EventPayload<TBot extends types.BaseBot> = { event: BotEvent<TBot> }
export type EventHandlerProps<TBot extends types.BaseBot> = CommonHandlerProps<TBot> & EventPayload<TBot>
export type EventHandler<TBot extends types.BaseBot> = (args: EventHandlerProps<TBot>) => Promise<void>

export type StateExpiredPayload<_TBot extends types.BaseBot> = { state: client.State }
export type StateExpiredHandlerProps<TBot extends types.BaseBot> = CommonHandlerProps<TBot> & StateExpiredPayload<TBot>
export type StateExpiredHandler<TBot extends types.BaseBot> = (args: StateExpiredHandlerProps<TBot>) => Promise<void>

export type BotHandlers<TBot extends types.BaseBot> = {
  messageHandlers: MessageHandler<TBot>[]
  eventHandlers: EventHandler<TBot>[]
  stateExpiredHandlers: StateExpiredHandler<TBot>[]
}

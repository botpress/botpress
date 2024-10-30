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

export type EventRequest<TBot extends types.BaseBot> = {
  event: {
    [K in keyof types.EnumerateEvents<TBot>]: utils.Merge<
      client.Event,
      { type: K; payload: types.EnumerateEvents<TBot>[K] }
    >
  }[keyof types.EnumerateEvents<TBot>]
}

export type MessageRequest<
  TBot extends types.BaseBot,
  TMessage extends keyof types.GetMessages<TBot> = keyof types.GetMessages<TBot>
> = {
  // TODO: use bot definiton message property to infer allowed tags (cannot be done until there is a bot.definition.ts file)
  message: utils.ValueOf<{
    [K in keyof types.GetMessages<TBot> as K extends TMessage ? K : never]: utils.Merge<
      client.Message,
      { type: K; payload: types.GetMessages<TBot>[K] }
    >
  }>
}

export type CommonHandlerProps<TBot extends types.BaseBot> = {
  ctx: BotContext
  client: BotSpecificClient<TBot>
}

export type MessagePayload<TBot extends types.BaseBot> = MessageRequest<TBot> & {
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

export type EventPayload<TBot extends types.BaseBot> = EventRequest<TBot>
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

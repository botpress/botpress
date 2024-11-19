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

type IncomingEvents<TBot extends types.BaseBot> = {
  [K in keyof types.EnumerateEvents<TBot>]: utils.Merge<
    client.Event,
    { type: K; payload: types.EnumerateEvents<TBot>[K] }
  >
}

type IncomingMessages<TBot extends types.BaseBot> = {
  // TODO: use bot definiton message property to infer allowed tags
  [K in keyof types.GetMessages<TBot>]: utils.Merge<client.Message, { type: K; payload: types.GetMessages<TBot>[K] }>
}

type OutgoingMessageRequests<TBot extends types.BaseBot> = {
  [K in keyof types.GetMessages<TBot>]: utils.Merge<
    client.ClientInputs['createMessage'],
    { type: K; payload: types.GetMessages<TBot>[K] }
  >
}

type OutgoingMessageResponses<TBot extends types.BaseBot> = {
  [K in keyof types.GetMessages<TBot>]: utils.Merge<
    client.ClientOutputs['createMessage'],
    {
      message: utils.Merge<client.Message, { type: K; payload: types.GetMessages<TBot>[K] }>
    }
  >
}

type OutgoingCallActionRequests<TBot extends types.BaseBot> = {
  [K in keyof types.EnumerateActionInputs<TBot>]: utils.Merge<
    client.ClientInputs['callAction'],
    { type: K; input: types.EnumerateActionInputs<TBot>[K] }
  >
}

type OutgoingCallActionResponses<TBot extends types.BaseBot> = {
  [K in keyof types.EnumerateActionOutputs<TBot>]: utils.Merge<
    client.ClientOutputs['callAction'],
    { output: types.EnumerateActionOutputs<TBot>[K] }
  >
}

export type IncomingEvent<TBot extends types.BaseBot> = utils.ValueOf<IncomingEvents<TBot>>
export type IncomingMessage<TBot extends types.BaseBot> = utils.ValueOf<IncomingMessages<TBot>>
export type OutgoingMessageRequest<TBot extends types.BaseBot> = utils.ValueOf<OutgoingMessageRequests<TBot>>
export type OutgoingMessageResponse<TBot extends types.BaseBot> = utils.ValueOf<OutgoingMessageResponses<TBot>>
export type OutgoingCallActionRequest<TBot extends types.BaseBot> = utils.ValueOf<OutgoingCallActionRequests<TBot>>
export type OutgoingCallActionResponse<TBot extends types.BaseBot> = utils.ValueOf<OutgoingCallActionResponses<TBot>>

export type CommonHandlerProps<TBot extends types.BaseBot> = {
  ctx: BotContext
  client: BotSpecificClient<TBot>
  self: BotHandlers<TBot>
}

export type MessagePayload<TBot extends types.BaseBot> = {
  message: IncomingMessage<TBot>
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

export type EventPayload<TBot extends types.BaseBot> = { event: IncomingEvent<TBot> }
export type EventHandlerProps<TBot extends types.BaseBot> = CommonHandlerProps<TBot> & EventPayload<TBot>
export type EventHandler<TBot extends types.BaseBot> = (args: EventHandlerProps<TBot>) => Promise<void>

export type StateExpiredPayload<_TBot extends types.BaseBot> = { state: client.State }
export type StateExpiredHandlerProps<TBot extends types.BaseBot> = CommonHandlerProps<TBot> & StateExpiredPayload<TBot>
export type StateExpiredHandler<TBot extends types.BaseBot> = (args: StateExpiredHandlerProps<TBot>) => Promise<void>

export type ActionHandlerPayloads<TBot extends types.BaseBot> = {
  [K in keyof TBot['actions']]: { type?: K; input: TBot['actions'][K]['input'] }
}
export type ActionHandlerProps<TBot extends types.BaseBot> = {
  [K in keyof TBot['actions']]: CommonHandlerProps<TBot> & ActionHandlerPayloads<TBot>[K]
}
export type ActionHandlers<TBot extends types.BaseBot> = {
  [K in keyof TBot['actions']]: (props: ActionHandlerProps<TBot>[K]) => Promise<TBot['actions'][K]['output']>
}

/**
 * TODO:
 * - add concept of stoppable / un-stoppable hooks (e.g. before_incoming_message  Vs before_outgoing_message)
 * - add "before_register", "after_register", "before_state_expired", "after_state_expired" hooks
 */
export type HookDefinitions<TBot extends types.BaseBot> = {
  before_incoming_event: IncomingEvents<TBot> & { '*': IncomingEvent<TBot> }
  before_incoming_message: IncomingMessages<TBot> & { '*': IncomingMessage<TBot> }
  before_outgoing_message: OutgoingMessageRequests<TBot> & { '*': OutgoingMessageRequest<TBot> }
  before_call_action: OutgoingCallActionRequests<TBot> & { '*': OutgoingCallActionRequest<TBot> }
  after_incoming_event: IncomingEvents<TBot> & { '*': IncomingEvent<TBot> }
  after_incoming_message: IncomingMessages<TBot> & { '*': IncomingMessage<TBot> }
  after_outgoing_message: OutgoingMessageResponses<TBot> & { '*': OutgoingMessageResponse<TBot> }
  after_call_action: OutgoingCallActionResponses<TBot> & { '*': OutgoingCallActionResponse<TBot> }
}

export type HookInputs<TBot extends types.BaseBot> = {
  [H in keyof HookDefinitions<TBot>]: {
    [T in keyof HookDefinitions<TBot>[H]]: {
      client: BotSpecificClient<TBot>
      ctx: BotContext
      data: HookDefinitions<TBot>[H][T]
    }
  }
}

export type HookOutputs<TBot extends types.BaseBot> = {
  [H in keyof HookDefinitions<TBot>]: {
    [T in keyof HookDefinitions<TBot>[H]]: {
      data: HookDefinitions<TBot>[H][T]
    }
  }
}

export type HookImplementations<TBot extends types.BaseBot> = {
  [H in keyof HookDefinitions<TBot>]: {
    [T in keyof HookDefinitions<TBot>[H]]: (
      input: HookInputs<TBot>[H][T]
    ) => Promise<HookOutputs<TBot>[H][T] | undefined | void>
  }
}

export type HookImplementationsMap<TBot extends types.BaseBot> = {
  [H in keyof HookDefinitions<TBot>]: {
    [T in keyof HookDefinitions<TBot>[H]]?: HookImplementations<TBot>[H][T][]
  }
}

export type BotHandlers<TBot extends types.BaseBot> = {
  actionHandlers: ActionHandlers<TBot>
  messageHandlers: MessageHandler<TBot>[]
  eventHandlers: EventHandler<TBot>[]
  stateExpiredHandlers: StateExpiredHandler<TBot>[]
  hooks: HookImplementationsMap<TBot>
}

import * as client from '@botpress/client'
import * as plugin from '../../plugin'
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

type _IncomingEvents<TBot extends types.BaseBot> = {
  [K in keyof types.EnumerateEvents<TBot>]: utils.Merge<
    client.Event,
    { type: K; payload: types.EnumerateEvents<TBot>[K] }
  >
}

type _IncomingMessages<TBot extends types.BaseBot> = {
  // TODO: use bot definiton message property to infer allowed tags
  [K in keyof types.GetMessages<TBot>]: utils.Merge<
    //
    client.Message,
    { type: K; payload: types.GetMessages<TBot>[K] }
  >
}

type _OutgoingMessageRequests<TBot extends types.BaseBot> = {
  [K in keyof types.GetMessages<TBot>]: utils.Merge<
    client.ClientInputs['createMessage'],
    { type: K; payload: types.GetMessages<TBot>[K] }
  >
}

type _OutgoingMessageResponses<TBot extends types.BaseBot> = {
  [K in keyof types.GetMessages<TBot>]: utils.Merge<
    client.ClientOutputs['createMessage'],
    {
      message: utils.Merge<client.Message, { type: K; payload: types.GetMessages<TBot>[K] }>
    }
  >
}

type _OutgoingCallActionRequests<TBot extends types.BaseBot> = {
  [K in keyof types.EnumerateActionInputs<TBot>]: utils.Merge<
    client.ClientInputs['callAction'],
    { type: K; input: types.EnumerateActionInputs<TBot>[K] }
  >
}

type _OutgoingCallActionResponses<TBot extends types.BaseBot> = {
  [K in keyof types.EnumerateActionOutputs<TBot>]: utils.Merge<
    client.ClientOutputs['callAction'],
    { output: types.EnumerateActionOutputs<TBot>[K] }
  >
}

export type AnyIncomingEvent<TBot extends types.BaseBot> = TBot['unknownDefinitions'] extends true
  ? client.Event
  : utils.ValueOf<_IncomingEvents<TBot>>
export type AnyIncomingMessage<TBot extends types.BaseBot> = TBot['unknownDefinitions'] extends true
  ? client.Message
  : utils.ValueOf<_IncomingMessages<TBot>>
export type AnyOutgoingMessageRequest<TBot extends types.BaseBot> = TBot['unknownDefinitions'] extends true
  ? client.ClientInputs['createMessage']
  : utils.ValueOf<_OutgoingMessageRequests<TBot>>
export type AnyOutgoingMessageResponse<TBot extends types.BaseBot> = TBot['unknownDefinitions'] extends true
  ? client.ClientOutputs['createMessage']
  : utils.ValueOf<_OutgoingMessageResponses<TBot>>
export type AnyOutgoingCallActionRequest<TBot extends types.BaseBot> = TBot['unknownDefinitions'] extends true
  ? client.ClientInputs['callAction']
  : utils.ValueOf<_OutgoingCallActionRequests<TBot>>
export type AnyOutgoingCallActionResponse<TBot extends types.BaseBot> = TBot['unknownDefinitions'] extends true
  ? client.ClientOutputs['callAction']
  : utils.ValueOf<_OutgoingCallActionResponses<TBot>>

export type IncomingEvents<TBot extends types.BaseBot> = _IncomingEvents<TBot> & {
  '*': AnyIncomingEvent<TBot>
}
export type IncomingMessages<TBot extends types.BaseBot> = _IncomingMessages<TBot> & {
  '*': AnyIncomingMessage<TBot>
}
export type IncomingStates<_TBot extends types.BaseBot> = {
  '*': client.State
}
export type OutgoingMessageRequests<TBot extends types.BaseBot> = _OutgoingMessageRequests<TBot> & {
  '*': AnyOutgoingMessageRequest<TBot>
}
export type OutgoingMessageResponses<TBot extends types.BaseBot> = _OutgoingMessageResponses<TBot> & {
  '*': AnyOutgoingMessageResponse<TBot>
}
export type OutgoingCallActionRequests<TBot extends types.BaseBot> = _OutgoingCallActionRequests<TBot> & {
  '*': AnyOutgoingCallActionRequest<TBot>
}
export type OutgoingCallActionResponses<TBot extends types.BaseBot> = _OutgoingCallActionResponses<TBot> & {
  '*': AnyOutgoingCallActionResponse<TBot>
}

export type CommonHandlerProps<TBot extends types.BaseBot> = {
  ctx: BotContext
  client: BotSpecificClient<TBot>
  self: BotHandlers<TBot>
}

export type MessagePayloads<TBot extends types.BaseBot> = {
  [K in keyof IncomingMessages<TBot>]: {
    message: IncomingMessages<TBot>[K]
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
}

export type MessageHandlers<TBot extends types.BaseBot> = {
  [K in keyof IncomingMessages<TBot>]: (args: CommonHandlerProps<TBot> & MessagePayloads<TBot>[K]) => Promise<void>
}

export type EventPayloads<TBot extends types.BaseBot> = {
  [K in keyof IncomingEvents<TBot>]: { event: IncomingEvents<TBot>[K] }
}

export type EventHandlers<TBot extends types.BaseBot> = {
  [K in keyof IncomingEvents<TBot>]: (args: CommonHandlerProps<TBot> & EventPayloads<TBot>[K]) => Promise<void>
}

export type StateExpiredPayloads<TBot extends types.BaseBot> = {
  [K in keyof IncomingStates<TBot>]: { state: IncomingStates<TBot>[K] }
}

export type StateExpiredHandlers<TBot extends types.BaseBot> = {
  [K in keyof IncomingStates<TBot>]: (args: CommonHandlerProps<TBot> & StateExpiredPayloads<TBot>[K]) => Promise<void>
}

export type ActionHandlerPayloads<TBot extends types.BaseBot> = {
  [K in keyof TBot['actions']]: { type?: K; input: TBot['actions'][K]['input'] }
}

export type ActionHandlers<TBot extends types.BaseBot> = {
  [K in keyof TBot['actions']]: (
    props: CommonHandlerProps<TBot> & ActionHandlerPayloads<TBot>[K]
  ) => Promise<TBot['actions'][K]['output']>
}

/**
 * TODO:
 * - add concept of stoppable / un-stoppable hooks (e.g. before_incoming_message  Vs before_outgoing_message)
 * - add "before_register", "after_register", "before_state_expired", "after_state_expired", "before_incoming_call_action", "after_incoming_call_action" hooks
 */
export type HookDefinitions<TBot extends types.BaseBot> = {
  before_incoming_event: _IncomingEvents<TBot> & { '*': AnyIncomingEvent<TBot> }
  before_incoming_message: _IncomingMessages<TBot> & { '*': AnyIncomingMessage<TBot> }
  before_outgoing_message: _OutgoingMessageRequests<TBot> & { '*': AnyOutgoingMessageRequest<TBot> }
  before_outgoing_call_action: _OutgoingCallActionRequests<TBot> & { '*': AnyOutgoingCallActionRequest<TBot> }
  after_incoming_event: _IncomingEvents<TBot> & { '*': AnyIncomingEvent<TBot> }
  after_incoming_message: _IncomingMessages<TBot> & { '*': AnyIncomingMessage<TBot> }
  after_outgoing_message: _OutgoingMessageResponses<TBot> & { '*': AnyOutgoingMessageResponse<TBot> }
  after_outgoing_call_action: _OutgoingCallActionResponses<TBot> & { '*': AnyOutgoingCallActionResponse<TBot> }
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

export type HookHandlers<TBot extends types.BaseBot> = {
  [H in keyof HookDefinitions<TBot>]: {
    [T in keyof HookDefinitions<TBot>[H]]: (
      input: HookInputs<TBot>[H][T]
    ) => Promise<HookOutputs<TBot>[H][T] | undefined | void>
  }
}

export type MessageHandlersMap<TBot extends types.BaseBot> = {
  [T in keyof IncomingMessages<TBot>]?: MessageHandlers<TBot>[T][]
}

export type EventHandlersMap<TBot extends types.BaseBot> = {
  [T in keyof IncomingEvents<TBot>]?: EventHandlers<TBot>[T][]
}

export type StateExpiredHandlersMap<TBot extends types.BaseBot> = {
  [T in keyof IncomingStates<TBot>]?: StateExpiredHandlers<TBot>[T][]
}

export type HookHandlersMap<TBot extends types.BaseBot> = {
  [H in keyof HookDefinitions<TBot>]: {
    [T in keyof HookDefinitions<TBot>[H]]?: HookHandlers<TBot>[H][T][]
  }
}

export type BotHandlers<TBot extends types.BaseBot> = {
  actionHandlers: ActionHandlers<TBot>
  messageHandlers: MessageHandlersMap<TBot>
  eventHandlers: EventHandlersMap<TBot>
  stateExpiredHandlers: StateExpiredHandlersMap<TBot>
  hookHandlers: HookHandlersMap<TBot>
}

// plugins

type ImplementedActions<
  _TBot extends types.BaseBot,
  TPlugins extends Record<string, plugin.BasePlugin>
> = utils.UnionToIntersection<
  utils.ValueOf<{
    [K in keyof TPlugins]: TPlugins[K]['actions']
  }>
>

type UnimplementedActions<TBot extends types.BaseBot, TPlugins extends Record<string, plugin.BasePlugin>> = Omit<
  TBot['actions'],
  keyof ImplementedActions<TBot, TPlugins>
>

export type ImplementedActionHandlers<
  TBot extends types.BaseBot,
  TPlugins extends Record<string, plugin.BasePlugin>
> = {
  [K in keyof ImplementedActions<TBot, TPlugins>]: ActionHandlers<TBot>[utils.Cast<K, keyof ActionHandlers<TBot>>]
}

export type UnimplementedActionHandlers<
  TBot extends types.BaseBot,
  TPlugins extends Record<string, plugin.BasePlugin>
> = {
  [K in keyof UnimplementedActions<TBot, TPlugins>]: ActionHandlers<TBot>[utils.Cast<K, keyof ActionHandlers<TBot>>]
}

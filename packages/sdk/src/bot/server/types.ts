import * as client from '@botpress/client'
import * as plugin from '../../plugin'
import * as utils from '../../utils/type-utils'
import { type BotLogger } from '../bot-logger'
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

type _IncomingStates<TBot extends types.BaseBot> = {
  [K in keyof types.EnumerateStates<TBot>]: utils.Merge<
    client.State,
    { name: K; payload: types.EnumerateStates<TBot>[K] }
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

export type AnyIncomingEvent<TBot extends types.BaseBot> = utils.ValueOf<_IncomingEvents<TBot>>
export type AnyIncomingMessage<TBot extends types.BaseBot> = utils.ValueOf<_IncomingMessages<TBot>>
export type AnyOutgoingMessageRequest<TBot extends types.BaseBot> = utils.ValueOf<_OutgoingMessageRequests<TBot>>
export type AnyOutgoingMessageResponse<TBot extends types.BaseBot> = utils.ValueOf<_OutgoingMessageResponses<TBot>>
export type AnyOutgoingCallActionRequest<TBot extends types.BaseBot> = utils.ValueOf<_OutgoingCallActionRequests<TBot>>
export type AnyOutgoingCallActionResponse<TBot extends types.BaseBot> = utils.ValueOf<
  _OutgoingCallActionResponses<TBot>
>

export type IncomingEvents<TBot extends types.BaseBot> = _IncomingEvents<TBot> & {
  '*': AnyIncomingEvent<TBot>
}
export type IncomingMessages<TBot extends types.BaseBot> = _IncomingMessages<TBot> & {
  '*': AnyIncomingMessage<TBot>
}
export type IncomingStates<_TBot extends types.BaseBot> = _IncomingStates<_TBot> & {
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

export type BotClient<TBot extends types.BaseBot> = BotSpecificClient<TBot>

export type CommonHandlerProps<TBot extends types.BaseBot> = {
  ctx: BotContext
  logger: BotLogger
  client: BotClient<TBot>
}

export type MessagePayloads<TBot extends types.BaseBot> = {
  [K in keyof IncomingMessages<TBot>]: CommonHandlerProps<TBot> & {
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
  [K in keyof IncomingMessages<TBot>]: (args: MessagePayloads<TBot>[K]) => Promise<void>
}

export type EventPayloads<TBot extends types.BaseBot> = {
  [K in keyof IncomingEvents<TBot>]: CommonHandlerProps<TBot> & { event: IncomingEvents<TBot>[K] }
}

export type EventHandlers<TBot extends types.BaseBot> = {
  [K in keyof IncomingEvents<TBot>]: (args: EventPayloads<TBot>[K]) => Promise<void>
}

export type StateExpiredPayloads<TBot extends types.BaseBot> = {
  [K in keyof IncomingStates<TBot>]: CommonHandlerProps<TBot> & { state: IncomingStates<TBot>[K] }
}

export type StateExpiredHandlers<TBot extends types.BaseBot> = {
  [K in keyof IncomingStates<TBot>]: (args: StateExpiredPayloads<TBot>[K]) => Promise<void>
}

export type ActionHandlerPayloads<TBot extends types.BaseBot> = {
  [K in keyof TBot['actions']]: CommonHandlerProps<TBot> & { type?: K; input: TBot['actions'][K]['input'] }
}

export type ActionHandlers<TBot extends types.BaseBot> = {
  [K in keyof TBot['actions']]: (props: ActionHandlerPayloads<TBot>[K]) => Promise<TBot['actions'][K]['output']>
}

type BaseHookDefinition = { stoppable?: boolean; data: any }
type HookDefinition<THookDef extends BaseHookDefinition = BaseHookDefinition> = THookDef

/**
 * TODO: add hooks for:
 *   - before_register
 *   - after_register
 *   - before_state_expired
 *   - after_state_expired
 *   - before_incoming_call_action
 *   - after_incoming_call_action
 */
export type HookDefinitions<TBot extends types.BaseBot> = {
  before_incoming_event: HookDefinition<{
    stoppable: true
    data: _IncomingEvents<TBot> & { '*': AnyIncomingEvent<TBot> }
  }>
  before_incoming_message: HookDefinition<{
    stoppable: true
    data: _IncomingMessages<TBot> & { '*': AnyIncomingMessage<TBot> }
  }>
  before_outgoing_message: HookDefinition<{
    stoppable: false
    data: _OutgoingMessageRequests<TBot> & { '*': AnyOutgoingMessageRequest<TBot> }
  }>
  before_outgoing_call_action: HookDefinition<{
    stoppable: false
    data: _OutgoingCallActionRequests<TBot> & { '*': AnyOutgoingCallActionRequest<TBot> }
  }>
  after_incoming_event: HookDefinition<{
    stoppable: true
    data: _IncomingEvents<TBot> & { '*': AnyIncomingEvent<TBot> }
  }>
  after_incoming_message: HookDefinition<{
    stoppable: true
    data: _IncomingMessages<TBot> & { '*': AnyIncomingMessage<TBot> }
  }>
  after_outgoing_message: HookDefinition<{
    stoppable: false
    data: _OutgoingMessageResponses<TBot> & { '*': AnyOutgoingMessageResponse<TBot> }
  }>
  after_outgoing_call_action: HookDefinition<{
    stoppable: false
    data: _OutgoingCallActionResponses<TBot> & { '*': AnyOutgoingCallActionResponse<TBot> }
  }>
}

export type HookData<TBot extends types.BaseBot> = {
  [H in keyof HookDefinitions<TBot>]: {
    [T in keyof HookDefinitions<TBot>[H]['data']]: HookDefinitions<TBot>[H]['data'][T]
  }
}

export type HookInputs<TBot extends types.BaseBot> = {
  [H in keyof HookData<TBot>]: {
    [T in keyof HookData<TBot>[H]]: CommonHandlerProps<TBot> & {
      data: HookData<TBot>[H][T]
    }
  }
}

export type HookOutputs<TBot extends types.BaseBot> = {
  [H in keyof HookData<TBot>]: {
    [T in keyof HookData<TBot>[H]]: {
      data?: HookData<TBot>[H][T]
    } & (HookDefinitions<TBot>[H]['stoppable'] extends true ? { stop?: boolean } : {})
  }
}

export type HookHandlers<TBot extends types.BaseBot> = {
  [H in keyof HookData<TBot>]: {
    [T in keyof HookData<TBot>[H]]: (input: HookInputs<TBot>[H][T]) => Promise<HookOutputs<TBot>[H][T] | undefined>
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
  [H in keyof HookData<TBot>]: {
    [T in keyof HookData<TBot>[H]]?: HookHandlers<TBot>[H][T][]
  }
}

/**
 * TODO:
 * the consumer of this type shouldnt be able to access "*" directly;
 * "*" is meant the user who registers an handler, not for the user who calls the handler
 */
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
  TPlugins extends Record<string, plugin.BasePlugin>,
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
  TPlugins extends Record<string, plugin.BasePlugin>,
> = {
  [K in keyof ImplementedActions<TBot, TPlugins>]: ActionHandlers<TBot>[utils.Cast<K, keyof ActionHandlers<TBot>>]
}

export type UnimplementedActionHandlers<
  TBot extends types.BaseBot,
  TPlugins extends Record<string, plugin.BasePlugin>,
> = {
  [K in keyof UnimplementedActions<TBot, TPlugins>]: ActionHandlers<TBot>[utils.Cast<K, keyof ActionHandlers<TBot>>]
}

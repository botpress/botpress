import * as client from '@botpress/client'
import * as bot from '../../bot'
import * as utils from '../../utils/type-utils'
import * as proxy from '../action-proxy'
import * as common from '../common'

type EnumeratePluginEvents<TPlugin extends common.BasePlugin> = bot.EnumerateEvents<TPlugin> &
  common.EnumerateInterfaceEvents<TPlugin>

type _IncomingEvents<TPlugin extends common.BasePlugin> = {
  [K in keyof EnumeratePluginEvents<TPlugin>]: utils.Merge<
    client.Event,
    { type: K; payload: EnumeratePluginEvents<TPlugin>[K] }
  >
}

type _IncomingMessages<TPlugin extends common.BasePlugin> = {
  // TODO: use bot definiton message property to infer allowed tags
  [K in keyof bot.GetMessages<TPlugin>]: utils.Merge<
    //
    client.Message,
    { type: K; payload: bot.GetMessages<TPlugin>[K] }
  >
}

type _IncomingStates<TPlugin extends common.BasePlugin> = {
  [K in keyof bot.EnumerateStates<TPlugin>]: utils.Merge<
    client.State,
    { name: K; payload: bot.EnumerateStates<TPlugin>[K] }
  >
}

type _OutgoingMessageRequests<TPlugin extends common.BasePlugin> = {
  [K in keyof bot.GetMessages<TPlugin>]: utils.Merge<
    client.ClientInputs['createMessage'],
    { type: K; payload: bot.GetMessages<TPlugin>[K] }
  >
}

type _OutgoingMessageResponses<TPlugin extends common.BasePlugin> = {
  [K in keyof bot.GetMessages<TPlugin>]: utils.Merge<
    client.ClientOutputs['createMessage'],
    {
      message: utils.Merge<client.Message, { type: K; payload: bot.GetMessages<TPlugin>[K] }>
    }
  >
}

type _OutgoingCallActionRequests<TPlugin extends common.BasePlugin> = {
  [K in keyof bot.EnumerateActionInputs<TPlugin>]: utils.Merge<
    client.ClientInputs['callAction'],
    { type: K; input: bot.EnumerateActionInputs<TPlugin>[K] }
  >
}

type _OutgoingCallActionResponses<TPlugin extends common.BasePlugin> = {
  [K in keyof bot.EnumerateActionOutputs<TPlugin>]: utils.Merge<
    client.ClientOutputs['callAction'],
    { output: bot.EnumerateActionOutputs<TPlugin>[K] }
  >
}

export type AnyIncomingEvent<_TPlugin extends common.BasePlugin> = client.Event
export type AnyIncomingMessage<_TPlugin extends common.BasePlugin> = client.Message
export type AnyOutgoingMessageRequest<_TPlugin extends common.BasePlugin> = client.ClientInputs['createMessage']
export type AnyOutgoingMessageResponse<_TPlugin extends common.BasePlugin> = client.ClientOutputs['createMessage']
export type AnyOutgoingCallActionRequest<_TPlugin extends common.BasePlugin> = client.ClientInputs['callAction']
export type AnyOutgoingCallActionResponse<_TPlugin extends common.BasePlugin> = client.ClientOutputs['callAction']

export type IncomingEvents<TPlugin extends common.BasePlugin> = _IncomingEvents<TPlugin> & {
  '*': AnyIncomingEvent<TPlugin>
}
export type IncomingMessages<TPlugin extends common.BasePlugin> = _IncomingMessages<TPlugin> & {
  '*': AnyIncomingMessage<TPlugin>
}
export type IncomingStates<_TPlugin extends common.BasePlugin> = _IncomingStates<_TPlugin> & {
  '*': client.State
}
export type OutgoingMessageRequests<TPlugin extends common.BasePlugin> = _OutgoingMessageRequests<TPlugin> & {
  '*': AnyOutgoingMessageRequest<TPlugin>
}
export type OutgoingMessageResponses<TPlugin extends common.BasePlugin> = _OutgoingMessageResponses<TPlugin> & {
  '*': AnyOutgoingMessageResponse<TPlugin>
}
export type OutgoingCallActionRequests<TPlugin extends common.BasePlugin> = _OutgoingCallActionRequests<TPlugin> & {
  '*': AnyOutgoingCallActionRequest<TPlugin>
}
export type OutgoingCallActionResponses<TPlugin extends common.BasePlugin> = _OutgoingCallActionResponses<TPlugin> & {
  '*': AnyOutgoingCallActionResponse<TPlugin>
}

// TODO: some ressources should be strongly type while leaving room for unknown definitions
export type PluginClient<_TPlugin extends common.BasePlugin> = bot.BotSpecificClient<common.BasePlugin>

export type PluginConfiguration<TPlugin extends common.BasePlugin> = TPlugin['configuration']

export type CommonHandlerProps<TPlugin extends common.BasePlugin> = {
  ctx: bot.BotContext
  logger: bot.BotLogger
  client: PluginClient<TPlugin>
  configuration: PluginConfiguration<TPlugin>
  interfaces: common.PluginInterfaceExtensions<TPlugin>
  actions: proxy.ActionProxy<TPlugin>
  render: common.PluginRenderFunction
}

export type MessagePayloads<TPlugin extends common.BasePlugin> = {
  [K in keyof IncomingMessages<TPlugin>]: CommonHandlerProps<TPlugin> & {
    message: IncomingMessages<TPlugin>[K]
    user: client.User
    conversation: client.Conversation
    event: client.Event
    states: {
      [TState in keyof TPlugin['states']]: {
        type: 'user' | 'conversation' | 'bot'
        payload: TPlugin['states'][TState]
      }
    }
  }
}

export type MessageHandlers<TPlugin extends common.BasePlugin> = {
  [K in keyof IncomingMessages<TPlugin>]: (args: MessagePayloads<TPlugin>[K]) => Promise<void>
}

export type EventPayloads<TPlugin extends common.BasePlugin> = {
  [K in keyof IncomingEvents<TPlugin>]: CommonHandlerProps<TPlugin> & { event: IncomingEvents<TPlugin>[K] }
}

export type EventHandlers<TPlugin extends common.BasePlugin> = {
  [K in keyof IncomingEvents<TPlugin>]: (args: EventPayloads<TPlugin>[K]) => Promise<void>
}

export type StateExpiredPayloads<TPlugin extends common.BasePlugin> = {
  [K in keyof IncomingStates<TPlugin>]: CommonHandlerProps<TPlugin> & { state: IncomingStates<TPlugin>[K] }
}

export type StateExpiredHandlers<TPlugin extends common.BasePlugin> = {
  [K in keyof IncomingStates<TPlugin>]: (args: StateExpiredPayloads<TPlugin>[K]) => Promise<void>
}

export type ActionHandlerPayloads<TPlugin extends common.BasePlugin> = {
  [K in keyof TPlugin['actions']]: CommonHandlerProps<TPlugin> & { type?: K; input: TPlugin['actions'][K]['input'] }
}

export type ActionHandlers<TPlugin extends common.BasePlugin> = {
  [K in keyof TPlugin['actions']]: (
    props: ActionHandlerPayloads<TPlugin>[K]
  ) => Promise<TPlugin['actions'][K]['output']>
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

export type HookDefinitionType = keyof HookDefinitions<common.BasePlugin>

export type HookDefinitions<TPlugin extends common.BasePlugin> = {
  before_incoming_event: HookDefinition<{
    stoppable: true
    data: _IncomingEvents<TPlugin> & { '*': AnyIncomingEvent<TPlugin> }
  }>
  before_incoming_message: HookDefinition<{
    stoppable: true
    data: _IncomingMessages<TPlugin> & { '*': AnyIncomingMessage<TPlugin> }
  }>
  before_outgoing_message: HookDefinition<{
    stoppable: false
    data: _OutgoingMessageRequests<TPlugin> & { '*': AnyOutgoingMessageRequest<TPlugin> }
  }>
  before_outgoing_call_action: HookDefinition<{
    stoppable: false
    data: _OutgoingCallActionRequests<TPlugin> & { '*': AnyOutgoingCallActionRequest<TPlugin> }
  }>
  after_incoming_event: HookDefinition<{
    stoppable: true
    data: _IncomingEvents<TPlugin> & { '*': AnyIncomingEvent<TPlugin> }
  }>
  after_incoming_message: HookDefinition<{
    stoppable: true
    data: _IncomingMessages<TPlugin> & { '*': AnyIncomingMessage<TPlugin> }
  }>
  after_outgoing_message: HookDefinition<{
    stoppable: false
    data: _OutgoingMessageResponses<TPlugin> & { '*': AnyOutgoingMessageResponse<TPlugin> }
  }>
  after_outgoing_call_action: HookDefinition<{
    stoppable: false
    data: _OutgoingCallActionResponses<TPlugin> & { '*': AnyOutgoingCallActionResponse<TPlugin> }
  }>
}

export type HookData<TPlugin extends common.BasePlugin> = {
  [H in keyof HookDefinitions<TPlugin>]: {
    [T in keyof HookDefinitions<TPlugin>[H]['data']]: HookDefinitions<TPlugin>[H]['data'][T]
  }
}

export type HookInputs<TPlugin extends common.BasePlugin> = {
  [H in keyof HookData<TPlugin>]: {
    [T in keyof HookData<TPlugin>[H]]: CommonHandlerProps<TPlugin> & {
      data: HookData<TPlugin>[H][T]
    }
  }
}

export type HookOutputs<TPlugin extends common.BasePlugin> = {
  [H in keyof HookData<TPlugin>]: {
    [T in keyof HookData<TPlugin>[H]]: {
      data?: HookData<TPlugin>[H][T]
    } & (HookDefinitions<TPlugin>[H]['stoppable'] extends true ? { stop?: boolean } : {})
  }
}

export type HookHandlers<TPlugin extends common.BasePlugin> = {
  [H in keyof HookData<TPlugin>]: {
    [T in keyof HookData<TPlugin>[H]]: (
      input: HookInputs<TPlugin>[H][T]
    ) => Promise<HookOutputs<TPlugin>[H][T] | undefined>
  }
}

export type MessageHandlersMap<TPlugin extends common.BasePlugin> = {
  [T in keyof IncomingMessages<TPlugin>]?: MessageHandlers<TPlugin>[T][]
}

export type EventHandlersMap<TPlugin extends common.BasePlugin> = {
  [T in keyof IncomingEvents<TPlugin>]?: EventHandlers<TPlugin>[T][]
}

export type StateExpiredHandlersMap<TPlugin extends common.BasePlugin> = {
  [T in keyof IncomingStates<TPlugin>]?: StateExpiredHandlers<TPlugin>[T][]
}

export type HookHandlersMap<TPlugin extends common.BasePlugin> = {
  [H in keyof HookData<TPlugin>]: {
    [T in keyof HookData<TPlugin>[H]]?: HookHandlers<TPlugin>[H][T][]
  }
}

export type PluginHandlers<TPlugin extends common.BasePlugin> = {
  actionHandlers: ActionHandlers<TPlugin>
  messageHandlers: MessageHandlersMap<TPlugin>
  eventHandlers: EventHandlersMap<TPlugin>
  stateExpiredHandlers: StateExpiredHandlersMap<TPlugin>
  hookHandlers: HookHandlersMap<TPlugin>
}

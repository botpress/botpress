import * as client from '@botpress/client'
import * as bot from '../../bot'
import * as workflowProxy from '../../bot/workflow-proxy'
import * as utils from '../../utils/type-utils'
import * as actionProxy from '../action-proxy'
import * as common from '../common'

type EnumeratePluginEvents<TPlugin extends common.BasePlugin> = bot.EnumerateEvents<TPlugin> &
  common.EnumerateInterfaceEvents<TPlugin>

type _IncomingEvents<TPlugin extends common.BasePlugin> = {
  [K in utils.StringKeys<EnumeratePluginEvents<TPlugin>>]: utils.Merge<
    client.Event,
    { type: K; payload: EnumeratePluginEvents<TPlugin>[K] }
  >
}

type _IncomingMessages<TPlugin extends common.BasePlugin> = {
  // TODO: use bot definiton message property to infer allowed tags
  [K in utils.StringKeys<bot.GetMessages<TPlugin>>]: utils.Merge<
    //
    client.Message,
    { type: K; payload: bot.GetMessages<TPlugin>[K] }
  >
}

type _IncomingStates<TPlugin extends common.BasePlugin> = {
  [K in utils.StringKeys<bot.EnumerateStates<TPlugin>>]: utils.Merge<
    client.State,
    { name: K; payload: bot.EnumerateStates<TPlugin>[K] }
  >
}

type _OutgoingMessageRequests<TPlugin extends common.BasePlugin> = {
  [K in utils.StringKeys<bot.GetMessages<TPlugin>>]: utils.Merge<
    client.ClientInputs['createMessage'],
    { type: K; payload: bot.GetMessages<TPlugin>[K] }
  >
}

type _OutgoingMessageResponses<TPlugin extends common.BasePlugin> = {
  [K in utils.StringKeys<bot.GetMessages<TPlugin>>]: utils.Merge<
    client.ClientOutputs['createMessage'],
    {
      message: utils.Merge<client.Message, { type: K; payload: bot.GetMessages<TPlugin>[K] }>
    }
  >
}

type _OutgoingCallActionRequests<TPlugin extends common.BasePlugin> = {
  [K in utils.StringKeys<bot.EnumerateActionInputs<TPlugin>>]: utils.Merge<
    client.ClientInputs['callAction'],
    { type: K; input: bot.EnumerateActionInputs<TPlugin>[K] }
  >
}

type _OutgoingCallActionResponses<TPlugin extends common.BasePlugin> = {
  [K in utils.StringKeys<bot.EnumerateActionOutputs<TPlugin>>]: utils.Merge<
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
  actions: actionProxy.ActionProxy<TPlugin>

  /**
   * # EXPERIMENTAL
   * This API is experimental and may change in the future.
   */
  workflows: workflowProxy.WorkflowProxy<TPlugin>
}

export type MessagePayloads<TPlugin extends common.BasePlugin> = {
  [TMessageName in utils.StringKeys<IncomingMessages<TPlugin>>]: CommonHandlerProps<TPlugin> & {
    message: IncomingMessages<TPlugin>[TMessageName]
    user: client.User
    conversation: client.Conversation
    event: client.Event
    states: {
      [TState in utils.StringKeys<TPlugin['states']>]: {
        type: 'user' | 'conversation' | 'bot'
        payload: TPlugin['states'][TState]
      }
    }
  }
}

export type MessageHandlers<TPlugin extends common.BasePlugin> = {
  [TMessageName in utils.StringKeys<IncomingMessages<TPlugin>>]: (
    args: MessagePayloads<TPlugin>[TMessageName]
  ) => Promise<void>
}

export type EventPayloads<TPlugin extends common.BasePlugin> = {
  [TEventName in utils.StringKeys<IncomingEvents<TPlugin>>]: CommonHandlerProps<TPlugin> & {
    event: IncomingEvents<TPlugin>[TEventName]
  }
}

export type EventHandlers<TPlugin extends common.BasePlugin> = {
  [TEventName in utils.StringKeys<IncomingEvents<TPlugin>>]: (args: EventPayloads<TPlugin>[TEventName]) => Promise<void>
}

export type StateExpiredPayloads<TPlugin extends common.BasePlugin> = {
  [TSateName in utils.StringKeys<IncomingStates<TPlugin>>]: CommonHandlerProps<TPlugin> & {
    state: IncomingStates<TPlugin>[TSateName]
  }
}

export type StateExpiredHandlers<TPlugin extends common.BasePlugin> = {
  [TSateName in utils.StringKeys<IncomingStates<TPlugin>>]: (
    args: StateExpiredPayloads<TPlugin>[TSateName]
  ) => Promise<void>
}

export type ActionHandlerPayloads<TPlugin extends common.BasePlugin> = {
  [TActionName in utils.StringKeys<TPlugin['actions']>]: CommonHandlerProps<TPlugin> & {
    type?: TActionName
    input: TPlugin['actions'][TActionName]['input']
  }
}

export type ActionHandlers<TPlugin extends common.BasePlugin> = {
  [TActionName in utils.StringKeys<TPlugin['actions']>]: (
    props: ActionHandlerPayloads<TPlugin>[TActionName]
  ) => Promise<TPlugin['actions'][TActionName]['output']>
}

export type WorkflowPayloads<TPlugin extends common.BasePlugin> = {
  [TWorkflowName in utils.StringKeys<TPlugin['workflows']>]: CommonHandlerProps<TPlugin> & {
    conversation?: client.Conversation
    user?: client.User

    /**
     * # EXPERIMENTAL
     * This API is experimental and may change in the future.
     */
    workflow: workflowProxy.WorkflowWithUtilities<TPlugin, TWorkflowName>
  }
}

export type WorkflowHandlers<TPlugin extends common.BasePlugin> = {
  [TWorkflowName in utils.StringKeys<TPlugin['workflows']>]: (
    props: WorkflowPayloads<TPlugin>[TWorkflowName]
  ) => Promise<void>
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
  [THookType in utils.StringKeys<HookDefinitions<TPlugin>>]: {
    [THookDataName in utils.StringKeys<
      HookDefinitions<TPlugin>[THookType]['data']
    >]: HookDefinitions<TPlugin>[THookType]['data'][THookDataName]
  }
}

export type HookInputs<TPlugin extends common.BasePlugin> = {
  [THookType in utils.StringKeys<HookData<TPlugin>>]: {
    [THookDataName in utils.StringKeys<HookData<TPlugin>[THookType]>]: CommonHandlerProps<TPlugin> & {
      data: HookData<TPlugin>[THookType][THookDataName]
    }
  }
}

export type HookOutputs<TPlugin extends common.BasePlugin> = {
  [THookType in utils.StringKeys<HookData<TPlugin>>]: {
    [THookDataName in utils.StringKeys<HookData<TPlugin>[THookType]>]: {
      data?: HookData<TPlugin>[THookType][THookDataName]
    } & (HookDefinitions<TPlugin>[THookType]['stoppable'] extends true ? { stop?: boolean } : {})
  }
}

export type HookHandlers<TPlugin extends common.BasePlugin> = {
  [THookType in utils.StringKeys<HookData<TPlugin>>]: {
    [THookDataName in utils.StringKeys<HookData<TPlugin>[THookType]>]: (
      input: HookInputs<TPlugin>[THookType][THookDataName]
    ) => Promise<HookOutputs<TPlugin>[THookType][THookDataName] | undefined>
  }
}

export type MessageHandlersMap<TPlugin extends common.BasePlugin> = {
  [TMessageName in utils.StringKeys<IncomingMessages<TPlugin>>]?: MessageHandlers<TPlugin>[TMessageName][]
}

export type EventHandlersMap<TPlugin extends common.BasePlugin> = {
  [TEventName in utils.StringKeys<IncomingEvents<TPlugin>>]?: EventHandlers<TPlugin>[TEventName][]
}

export type StateExpiredHandlersMap<TPlugin extends common.BasePlugin> = {
  [TStateName in utils.StringKeys<IncomingStates<TPlugin>>]?: StateExpiredHandlers<TPlugin>[TStateName][]
}

export type HookHandlersMap<TPlugin extends common.BasePlugin> = {
  [THookType in utils.StringKeys<HookData<TPlugin>>]: {
    [THookDataName in utils.StringKeys<
      HookData<TPlugin>[THookType]
    >]?: HookHandlers<TPlugin>[THookType][THookDataName][]
  }
}

export type WorkflowHandlersMap<TPlugin extends common.BasePlugin> = {
  [TWorkflowUpdateType in bot.WorkflowUpdateType]: {
    [TWorkflowName in utils.StringKeys<TPlugin['workflows']>]?: {
      handler: WorkflowHandlers<TPlugin>[TWorkflowName]
      order: number
    }[]
  }
}

export type OrderedMessageHandlersMap<TPlugin extends common.BasePlugin> = {
  [TMessageName in utils.StringKeys<IncomingMessages<TPlugin>>]?: {
    handler: MessageHandlers<TPlugin>[TMessageName]
    order: number
  }[]
}

export type OrderedEventHandlersMap<TPlugin extends common.BasePlugin> = {
  [TEventName in utils.StringKeys<IncomingEvents<TPlugin>>]?: {
    handler: EventHandlers<TPlugin>[TEventName]
    order: number
  }[]
}

export type OrderedStateExpiredHandlersMap<TPlugin extends common.BasePlugin> = {
  [TStateName in utils.StringKeys<IncomingStates<TPlugin>>]?: {
    handler: StateExpiredHandlers<TPlugin>[TStateName]
    order: number
  }[]
}

export type OrderedHookHandlersMap<TPlugin extends common.BasePlugin> = {
  [THookType in utils.StringKeys<HookData<TPlugin>>]: {
    [THookDataName in utils.StringKeys<HookData<TPlugin>[THookType]>]?: {
      handler: HookHandlers<TPlugin>[THookType][THookDataName]
      order: number
    }[]
  }
}

export type OrderedWorkflowHandlersMap<TPlugin extends common.BasePlugin> = {
  [TWorkflowUpdateType in bot.WorkflowUpdateType]: {
    [TWorkflowName in utils.StringKeys<TPlugin['workflows']>]?: {
      handler: WorkflowHandlers<TPlugin>[TWorkflowName]
      order: number
    }[]
  }
}

export type PluginHandlers<TPlugin extends common.BasePlugin> = {
  actionHandlers: ActionHandlers<TPlugin>
  messageHandlers: MessageHandlersMap<TPlugin>
  eventHandlers: EventHandlersMap<TPlugin>
  stateExpiredHandlers: StateExpiredHandlersMap<TPlugin>
  hookHandlers: HookHandlersMap<TPlugin>
  workflowHandlers: WorkflowHandlersMap<TPlugin>
}

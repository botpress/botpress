import * as client from '@botpress/client'
import * as bot from '../../bot'
import * as workflowProxy from '../../bot/workflow-proxy'
import * as utils from '../../utils/type-utils'
import * as actionProxy from '../action-proxy'
import * as common from '../common'
import * as conversationProxy from '../conversation-proxy'
import * as eventProxy from '../event-proxy'
import * as messageProxy from '../message-proxy'
import * as stateProxy from '../state-proxy'
import * as userProxy from '../user-proxy'

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
    { type: Extract<K, string>; payload: bot.GetMessages<TPlugin>[K] }
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
    { type: K; output: bot.EnumerateActionOutputs<TPlugin>[K] }
  >
}

type _IncomingCallActionRequests<TPlugin extends common.BasePlugin> = {
  [K in utils.StringKeys<TPlugin['actions']>]: { type: K; input: TPlugin['actions'][K]['input'] }
}

type _IncomingCallActionResponses<TPlugin extends common.BasePlugin> = {
  [K in utils.StringKeys<TPlugin['actions']>]: { type: K; output: TPlugin['actions'][K]['output'] }
}

export type AnyIncomingEvent<_TPlugin extends common.BasePlugin> = client.Event
export type AnyIncomingMessage<_TPlugin extends common.BasePlugin> = client.Message
export type AnyOutgoingMessageRequest<_TPlugin extends common.BasePlugin> = client.ClientInputs['createMessage']
export type AnyOutgoingMessageResponse<_TPlugin extends common.BasePlugin> = client.ClientOutputs['createMessage']
export type AnyOutgoingCallActionRequest<_TPlugin extends common.BasePlugin> = client.ClientInputs['callAction']
export type AnyOutgoingCallActionResponse<_TPlugin extends common.BasePlugin> = client.ClientOutputs['callAction'] & {
  type: string
}
export type AnyIncomingCallActionRequest<_TPlugin extends common.BasePlugin> = {
  type: string
  input: Record<string, unknown>
}
export type AnyIncomingCallActionResponse<_TPlugin extends common.BasePlugin> = {
  type: string
  output: Record<string, unknown>
}

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
export type IncomingCallActionRequest<TPlugin extends common.BasePlugin> = _IncomingCallActionRequests<TPlugin> & {
  '*': AnyIncomingCallActionRequest<TPlugin>
}
export type IncomingCallActionResponse<TPlugin extends common.BasePlugin> = _IncomingCallActionResponses<TPlugin> & {
  '*': AnyIncomingCallActionResponse<TPlugin>
}

// TODO: some ressources should be strongly type while leaving room for unknown definitions
export type PluginClient<_TPlugin extends common.BasePlugin> = bot.BotSpecificClient<common.BasePlugin>

export type CommonHandlerProps<TPlugin extends common.BasePlugin> = {
  ctx: bot.BotContext
  logger: bot.BotLogger
  /**
   * Please use the `users`, `conversations`, `actions`, `messages`, `states`,
   * `events`, `workflows` utilities instead of accessing the client directly.
   *
   * For example, you can replace `props.client.listUsers(...)` with
   * `props.users.list(...).take(n)`
   */
  client: PluginClient<TPlugin>
}

export type InjectedHandlerProps<TPlugin extends common.BasePlugin> = {
  configuration: common.PluginConfiguration<TPlugin>
  /**
   * Mapping of plugin interface dependencies to the integrations that
   * implement them.
   */
  interfaces: common.PluginInterfaceExtensions<TPlugin>
  /**
   * Mapping of plugin integration dependencies to the integrations that
   * implement them.
   */
  integrations: common.PluginIntegrationExtensions<TPlugin>
  /**
   * Alias of the plugin within the bot. This is usually equal to the plugin's
   * name, but may be different if the bot has multiple instances of the same
   * plugin installed.
   */
  alias: string
  /**
   * Allows calling actions defined by the plugins's integration and interface
   * dependencies.
   */
  actions: actionProxy.ActionProxy<TPlugin>
  /**
   * Allows querying and mutating states defined by the plugin.
   */
  states: stateProxy.StateProxy<TPlugin>
  /**
   * Allows emitting events defined by the plugin.
   */
  events: eventProxy.EventProxy<TPlugin>
  /**
   * Allows querying and mutating users.
   */
  users: userProxy.UserFinder<TPlugin>
  /**
   * Allows querying and mutating conversations on channels defined by the
   * plugin's integration and interface dependencies.
   */
  conversations: conversationProxy.ConversationFinder<TPlugin>
  /**
   * Allows querying and mutating individual messages.
   */
  messages: messageProxy.MessageFinder<TPlugin>

  /**
   * # EXPERIMENTAL
   * This API is experimental and may change in the future.
   */
  workflows: workflowProxy.WorkflowProxy<TPlugin>
}

type _WithInjectedProps<
  T extends Record<string, Record<string, any>>,
  TPlugin extends common.BasePlugin,
  TMerge extends object = {},
> = {
  [K in keyof T]: utils.Merge<T[K], TMerge> & InjectedHandlerProps<TPlugin>
}

type _WithInjectedPropsFn<
  T extends Record<string, (args: any) => any>,
  TPlugin extends common.BasePlugin,
  TMerge extends object = {},
> = {
  [K in keyof T]: (args: utils.Merge<Parameters<T[K]>[0], TMerge> & InjectedHandlerProps<TPlugin>) => ReturnType<T[K]>
}

export type MessagePayloadsWithoutInjectedProps<TPlugin extends common.BasePlugin> = {
  [TMessageName in utils.StringKeys<IncomingMessages<TPlugin>>]: CommonHandlerProps<TPlugin> & {
    message: IncomingMessages<TPlugin>[TMessageName]
    user: client.User
    conversation: client.Conversation
    event: client.Event
  }
}

export type MessageHandlersWithoutInjectedProps<TPlugin extends common.BasePlugin> = {
  [TMessageName in utils.StringKeys<IncomingMessages<TPlugin>>]: (
    args: MessagePayloadsWithoutInjectedProps<TPlugin>[TMessageName]
  ) => Promise<void>
}

export type MessageHandlers<TPlugin extends common.BasePlugin> = _WithInjectedPropsFn<
  MessageHandlersWithoutInjectedProps<TPlugin>,
  TPlugin,
  {
    user: userProxy.ActionableUser<TPlugin, string>
    conversation: conversationProxy.ActionableConversation<TPlugin>
    message: messageProxy.ActionableMessage<TPlugin>
  }
>

export type EventPayloadsWithoutInjectedProps<TPlugin extends common.BasePlugin> = {
  [TEventName in utils.StringKeys<IncomingEvents<TPlugin>>]: CommonHandlerProps<TPlugin> & {
    event: IncomingEvents<TPlugin>[TEventName]
  }
}

export type EventPayloads<TPlugin extends common.BasePlugin> = _WithInjectedProps<
  EventPayloadsWithoutInjectedProps<TPlugin>,
  TPlugin
>

export type EventHandlersWithoutInjectedProps<TPlugin extends common.BasePlugin> = {
  [TEventName in utils.StringKeys<IncomingEvents<TPlugin>>]: (
    args: EventPayloadsWithoutInjectedProps<TPlugin>[TEventName]
  ) => Promise<void>
}

export type EventHandlers<TPlugin extends common.BasePlugin> = _WithInjectedPropsFn<
  EventHandlersWithoutInjectedProps<TPlugin>,
  TPlugin
>

export type StateExpiredPayloadsWithoutInjectedProps<TPlugin extends common.BasePlugin> = {
  [TSateName in utils.StringKeys<IncomingStates<TPlugin>>]: CommonHandlerProps<TPlugin> & {
    state: IncomingStates<TPlugin>[TSateName]
  }
}

export type StateExpiredPayloads<TPlugin extends common.BasePlugin> = _WithInjectedProps<
  StateExpiredPayloadsWithoutInjectedProps<TPlugin>,
  TPlugin
>

export type StateExpiredHandlersWithoutInjectedProps<TPlugin extends common.BasePlugin> = {
  [TSateName in utils.StringKeys<IncomingStates<TPlugin>>]: (
    args: StateExpiredPayloadsWithoutInjectedProps<TPlugin>[TSateName]
  ) => Promise<void>
}

export type StateExpiredHandlers<TPlugin extends common.BasePlugin> = _WithInjectedPropsFn<
  StateExpiredHandlersWithoutInjectedProps<TPlugin>,
  TPlugin
>

export type ActionHandlerPayloadsWithoutInjectedProps<TPlugin extends common.BasePlugin> = {
  [TActionName in utils.StringKeys<TPlugin['actions']>]: CommonHandlerProps<TPlugin> & {
    type?: TActionName
    input: TPlugin['actions'][TActionName]['input']
  }
}

export type ActionHandlerPayloads<TPlugin extends common.BasePlugin> = _WithInjectedProps<
  ActionHandlerPayloadsWithoutInjectedProps<TPlugin>,
  TPlugin
>

export type ActionHandlersWithoutInjectedProps<TPlugin extends common.BasePlugin> = {
  [TActionName in utils.StringKeys<TPlugin['actions']>]: (
    props: ActionHandlerPayloadsWithoutInjectedProps<TPlugin>[TActionName]
  ) => Promise<TPlugin['actions'][TActionName]['output']>
}

export type ActionHandlers<TPlugin extends common.BasePlugin> = _WithInjectedPropsFn<
  ActionHandlersWithoutInjectedProps<TPlugin>,
  TPlugin
>

export type WorkflowPayloadsWithoutInjectedProps<TPlugin extends common.BasePlugin> = {
  [TWorkflowName in utils.StringKeys<TPlugin['workflows']>]: CommonHandlerProps<TPlugin> & {
    conversation?: client.Conversation
    user?: client.User
    event: bot.WorkflowUpdateEvent
    workflow: client.Workflow
  }
}

export type WorkflowPayloads<TPlugin extends common.BasePlugin> = _WithInjectedProps<
  {
    [TWorkflowName in keyof WorkflowPayloadsWithoutInjectedProps<TPlugin>]: utils.Merge<
      WorkflowPayloadsWithoutInjectedProps<TPlugin>[TWorkflowName],
      {
        /**
         * # EXPERIMENTAL
         * This API is experimental and may change in the future.
         */
        workflow: workflowProxy.ActionableWorkflow<TPlugin, TWorkflowName>
      }
    >
  },
  TPlugin
>

export type WorkflowHandlersWithoutInjectedProps<TPlugin extends common.BasePlugin> = {
  [TWorkflowName in utils.StringKeys<TPlugin['workflows']>]: (
    props: WorkflowPayloadsWithoutInjectedProps<TPlugin>[TWorkflowName]
  ) => Promise<void>
}

export type WorkflowHandlers<TPlugin extends common.BasePlugin> = {
  [TWorkflowName in utils.StringKeys<TPlugin['workflows']>]: (
    props: utils.Merge<
      WorkflowPayloads<TPlugin>[TWorkflowName],
      {
        workflow: workflowProxy.ActionableWorkflow<TPlugin, TWorkflowName>
      }
    >
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
  before_incoming_call_action: HookDefinition<{
    stoppable: true
    data: _IncomingCallActionRequests<TPlugin> & { '*': AnyIncomingCallActionRequest<TPlugin> }
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
  after_incoming_call_action: HookDefinition<{
    stoppable: true
    data: _IncomingCallActionResponses<TPlugin> & { '*': AnyIncomingCallActionResponse<TPlugin> }
  }>
}

export type HookData<TPlugin extends common.BasePlugin> = {
  [THookType in utils.StringKeys<HookDefinitions<TPlugin>>]: {
    [THookDataName in utils.StringKeys<
      HookDefinitions<TPlugin>[THookType]['data']
    >]: HookDefinitions<TPlugin>[THookType]['data'][THookDataName]
  }
}

export type HookInputsWithoutInjectedProps<TPlugin extends common.BasePlugin> = {
  [THookType in utils.StringKeys<HookData<TPlugin>>]: {
    [THookDataName in utils.StringKeys<HookData<TPlugin>[THookType]>]: CommonHandlerProps<TPlugin> & {
      data: HookData<TPlugin>[THookType][THookDataName]
    }
  }
}

export type HookInputs<TPlugin extends common.BasePlugin> = {
  [THookType in utils.StringKeys<HookData<TPlugin>>]: _WithInjectedProps<
    HookInputsWithoutInjectedProps<TPlugin>[THookType],
    TPlugin
  >
}

export type HookOutputs<TPlugin extends common.BasePlugin> = {
  [THookType in utils.StringKeys<HookData<TPlugin>>]: {
    [THookDataName in utils.StringKeys<HookData<TPlugin>[THookType]>]: {
      data?: HookData<TPlugin>[THookType][THookDataName]
    } & (HookDefinitions<TPlugin>[THookType]['stoppable'] extends true ? { stop?: boolean } : {})
  }
}

export type HookHandlersWithoutInjectedProps<TPlugin extends common.BasePlugin> = {
  [THookType in utils.StringKeys<HookData<TPlugin>>]: {
    [THookDataName in utils.StringKeys<HookData<TPlugin>[THookType]>]: (
      input: HookInputsWithoutInjectedProps<TPlugin>[THookType][THookDataName]
    ) => Promise<HookOutputs<TPlugin>[THookType][THookDataName] | undefined>
  }
}

export type HookHandlers<TPlugin extends common.BasePlugin> = {
  [THookType in utils.StringKeys<HookData<TPlugin>>]: _WithInjectedPropsFn<
    HookHandlersWithoutInjectedProps<TPlugin>[THookType],
    TPlugin
  >
}

export type HookHandlersMap<TPlugin extends common.BasePlugin> = {
  [THookType in utils.StringKeys<HookData<TPlugin>>]: {
    [THookDataName in utils.StringKeys<
      HookData<TPlugin>[THookType]
    >]?: HookHandlersWithoutInjectedProps<TPlugin>[THookType][THookDataName][]
  }
}

export type WorkflowHandlersMap<TPlugin extends common.BasePlugin> = {
  [TWorkflowUpdateType in bot.WorkflowUpdateType]: {
    [TWorkflowName in utils.StringKeys<TPlugin['workflows']>]?: {
      handler: (
        props: Omit<Parameters<WorkflowHandlersWithoutInjectedProps<TPlugin>[TWorkflowName]>[0], 'workflow'> & {
          workflow: client.Workflow
        }
      ) => Promise<client.Workflow>
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

/** Plugin handlers without InjectedHandlerProps */
export type PluginHandlers<TPlugin extends common.BasePlugin> = {
  actionHandlers: ActionHandlersWithoutInjectedProps<TPlugin>
  messageHandlers: {
    [TMessageName in utils.StringKeys<
      IncomingMessages<TPlugin>
    >]?: MessageHandlersWithoutInjectedProps<TPlugin>[TMessageName][]
  }
  eventHandlers: {
    [TEventName in utils.StringKeys<IncomingEvents<TPlugin>>]?: EventHandlersWithoutInjectedProps<TPlugin>[TEventName][]
  }
  stateExpiredHandlers: {
    [TStateName in utils.StringKeys<
      IncomingStates<TPlugin>
    >]?: StateExpiredHandlersWithoutInjectedProps<TPlugin>[TStateName][]
  }
  hookHandlers: {
    [THookType in utils.StringKeys<HookData<TPlugin>>]: {
      [THookDataName in utils.StringKeys<
        HookData<TPlugin>[THookType]
      >]?: HookHandlersWithoutInjectedProps<TPlugin>[THookType][THookDataName][]
    }
  }
  workflowHandlers: {
    [TWorkflowUpdateType in bot.WorkflowUpdateType]: {
      [TWorkflowName in utils.StringKeys<
        TPlugin['workflows']
      >]?: WorkflowHandlersWithoutInjectedProps<TPlugin>[TWorkflowName][]
    }
  }
}
/** identical to PluginHandlers, but contains the injected properties */
export type InjectedPluginHandlers<TPlugin extends common.BasePlugin> = {
  actionHandlers: ActionHandlers<TPlugin>
  messageHandlers: {
    [TMessageName in utils.StringKeys<IncomingMessages<TPlugin>>]?: MessageHandlers<TPlugin>[TMessageName][]
  }
  eventHandlers: {
    [TEventName in utils.StringKeys<IncomingEvents<TPlugin>>]?: EventHandlers<TPlugin>[TEventName][]
  }
  stateExpiredHandlers: {
    [TStateName in utils.StringKeys<IncomingStates<TPlugin>>]?: StateExpiredHandlers<TPlugin>[TStateName][]
  }
  hookHandlers: {
    [THookType in utils.StringKeys<HookData<TPlugin>>]: {
      [THookDataName in utils.StringKeys<
        HookData<TPlugin>[THookType]
      >]?: HookHandlers<TPlugin>[THookType][THookDataName][]
    }
  }
  workflowHandlers: {
    [TWorkflowUpdateType in bot.WorkflowUpdateType]: {
      [TWorkflowName in utils.StringKeys<TPlugin['workflows']>]?: WorkflowHandlers<TPlugin>[TWorkflowName][]
    }
  }
}

import * as client from '@botpress/client'
import * as plugin from '../../plugin'
import type { Request } from '../../serve'
import * as utils from '../../utils/type-utils'
import { type BotLogger } from '../bot-logger'
import { BotSpecificClient } from '../client'
import * as common from '../common'
import type * as workflowProxy from '../workflow-proxy/types'

export type BotOperation = 'event_received' | 'register' | 'unregister' | 'ping' | 'action_triggered'
export type BotContext = {
  botId: string
  type: string
  operation: BotOperation
  configuration: {
    payload: string
  }
}

type _IncomingEvents<TBot extends common.BaseBot> = {
  [K in utils.StringKeys<common.EnumerateEvents<TBot>>]: utils.Merge<
    client.Event,
    { type: K; payload: common.EnumerateEvents<TBot>[K] }
  >
}

type _IncomingMessages<TBot extends common.BaseBot> = {
  // TODO: use bot definiton message property to infer allowed tags
  [K in utils.StringKeys<common.GetMessages<TBot>>]: utils.Merge<
    //
    client.Message,
    { type: K; payload: common.GetMessages<TBot>[K] }
  >
}

type _IncomingStates<TBot extends common.BaseBot> = {
  [K in utils.StringKeys<common.EnumerateStates<TBot>>]: utils.Merge<
    client.State,
    { name: K; payload: common.EnumerateStates<TBot>[K] }
  >
}

type _OutgoingMessageRequests<TBot extends common.BaseBot> = {
  [K in utils.StringKeys<common.GetMessages<TBot>>]: utils.Merge<
    client.ClientInputs['createMessage'],
    { type: K; payload: common.GetMessages<TBot>[K] }
  >
}

type _OutgoingMessageResponses<TBot extends common.BaseBot> = {
  [K in utils.StringKeys<common.GetMessages<TBot>>]: utils.Merge<
    client.ClientOutputs['createMessage'],
    {
      message: utils.Merge<client.Message, { type: K; payload: common.GetMessages<TBot>[K] }>
    }
  >
}

type _OutgoingCallActionRequests<TBot extends common.BaseBot> = {
  [K in utils.StringKeys<common.EnumerateActionInputs<TBot>>]: utils.Merge<
    client.ClientInputs['callAction'],
    { type: K; input: common.EnumerateActionInputs<TBot>[K] }
  >
}

type _OutgoingCallActionResponses<TBot extends common.BaseBot> = {
  [K in utils.StringKeys<common.EnumerateActionOutputs<TBot>>]: utils.Merge<
    client.ClientOutputs['callAction'],
    { output: common.EnumerateActionOutputs<TBot>[K] }
  >
}

export type AnyIncomingEvent<TBot extends common.BaseBot> = utils.ValueOf<_IncomingEvents<TBot>>
export type AnyIncomingMessage<TBot extends common.BaseBot> = utils.ValueOf<_IncomingMessages<TBot>>
export type AnyOutgoingMessageRequest<TBot extends common.BaseBot> = utils.ValueOf<_OutgoingMessageRequests<TBot>>
export type AnyOutgoingMessageResponse<TBot extends common.BaseBot> = utils.ValueOf<_OutgoingMessageResponses<TBot>>
export type AnyOutgoingCallActionRequest<TBot extends common.BaseBot> = utils.ValueOf<_OutgoingCallActionRequests<TBot>>
export type AnyOutgoingCallActionResponse<TBot extends common.BaseBot> = utils.ValueOf<
  _OutgoingCallActionResponses<TBot>
>

export type IncomingEvents<TBot extends common.BaseBot> = _IncomingEvents<TBot> & {
  '*': AnyIncomingEvent<TBot>
}
export type IncomingMessages<TBot extends common.BaseBot> = _IncomingMessages<TBot> & {
  '*': AnyIncomingMessage<TBot>
}
export type IncomingStates<_TBot extends common.BaseBot> = _IncomingStates<_TBot> & {
  '*': client.State
}
export type OutgoingMessageRequests<TBot extends common.BaseBot> = _OutgoingMessageRequests<TBot> & {
  '*': AnyOutgoingMessageRequest<TBot>
}
export type OutgoingMessageResponses<TBot extends common.BaseBot> = _OutgoingMessageResponses<TBot> & {
  '*': AnyOutgoingMessageResponse<TBot>
}
export type OutgoingCallActionRequests<TBot extends common.BaseBot> = _OutgoingCallActionRequests<TBot> & {
  '*': AnyOutgoingCallActionRequest<TBot>
}
export type OutgoingCallActionResponses<TBot extends common.BaseBot> = _OutgoingCallActionResponses<TBot> & {
  '*': AnyOutgoingCallActionResponse<TBot>
}

export type BotClient<TBot extends common.BaseBot> = BotSpecificClient<TBot>

export type CommonHandlerProps<TBot extends common.BaseBot> = {
  ctx: BotContext
  logger: BotLogger
  client: BotClient<TBot>

  /**
   * # EXPERIMENTAL
   * This API is experimental and may change in the future.
   */
  workflows: workflowProxy.WorkflowProxy<TBot>
}

export type MessagePayloads<TBot extends common.BaseBot> = {
  [TMessageName in utils.StringKeys<IncomingMessages<TBot>>]: CommonHandlerProps<TBot> & {
    message: IncomingMessages<TBot>[TMessageName]
    user: client.User
    conversation: client.Conversation
    event: client.Event
    states: {
      [TState in utils.StringKeys<TBot['states']>]: {
        type: 'user' | 'conversation' | 'bot'
        payload: TBot['states'][TState]
      }
    }
  }
}

export type MessageHandlers<TBot extends common.BaseBot> = {
  [TMessageName in utils.StringKeys<IncomingMessages<TBot>>]: (
    args: MessagePayloads<TBot>[TMessageName]
  ) => Promise<void>
}

export type EventPayloads<TBot extends common.BaseBot> = {
  [TEventName in utils.StringKeys<IncomingEvents<TBot>>]: CommonHandlerProps<TBot> & {
    event: IncomingEvents<TBot>[TEventName]
  }
}

export type EventHandlers<TBot extends common.BaseBot> = {
  [TEventName in utils.StringKeys<IncomingEvents<TBot>>]: (args: EventPayloads<TBot>[TEventName]) => Promise<void>
}

export type StateExpiredPayloads<TBot extends common.BaseBot> = {
  [TSateName in utils.StringKeys<IncomingStates<TBot>>]: CommonHandlerProps<TBot> & {
    state: IncomingStates<TBot>[TSateName]
  }
}

export type StateExpiredHandlers<TBot extends common.BaseBot> = {
  [TSateName in utils.StringKeys<IncomingStates<TBot>>]: (args: StateExpiredPayloads<TBot>[TSateName]) => Promise<void>
}

export type ActionHandlerPayloads<TBot extends common.BaseBot> = {
  [TActionName in utils.StringKeys<TBot['actions']>]: CommonHandlerProps<TBot> & {
    type?: TActionName
    input: TBot['actions'][TActionName]['input']
  }
}

export type ActionHandlers<TBot extends common.BaseBot> = {
  [TActionName in utils.StringKeys<TBot['actions']>]: (
    props: ActionHandlerPayloads<TBot>[TActionName]
  ) => Promise<TBot['actions'][TActionName]['output']>
}

export type BridgeWorkflowUpdateType =
  | 'child_workflow_deleted'
  | 'child_workflow_finished'
  | 'workflow_timedout'
  | 'workflow_started'
  | 'workflow_continued'
export type WorkflowUpdateEventPayload = {
  type: BridgeWorkflowUpdateType
  childWorkflow?: client.Workflow
  workflow: client.Workflow
  conversation?: client.Conversation
  user?: client.User
}
export type WorkflowUpdateEvent = utils.Merge<
  client.Event,
  {
    type: 'workflow_update'
    payload: WorkflowUpdateEventPayload
  }
>

export type WorkflowPayloads<TBot extends common.BaseBot> = {
  [TWorkflowName in utils.StringKeys<TBot['workflows']>]: CommonHandlerProps<TBot> & {
    conversation?: client.Conversation
    user?: client.User

    /**
     * # EXPERIMENTAL
     * This API is experimental and may change in the future.
     */
    workflow: workflowProxy.WorkflowWithUtilities<TBot, TWorkflowName>
  }
}

export type WorkflowHandlers<TBot extends common.BaseBot> = {
  [TWorkflowName in utils.StringKeys<TBot['workflows']>]: (
    props: WorkflowPayloads<TBot>[TWorkflowName]
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
export type HookDefinitions<TBot extends common.BaseBot> = {
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

export type HookData<TBot extends common.BaseBot> = {
  [THookType in utils.StringKeys<HookDefinitions<TBot>>]: {
    [THookDataName in utils.StringKeys<
      HookDefinitions<TBot>[THookType]['data']
    >]: HookDefinitions<TBot>[THookType]['data'][THookDataName]
  }
}

export type HookInputs<TBot extends common.BaseBot> = {
  [THookType in utils.StringKeys<HookData<TBot>>]: {
    [THookDataName in utils.StringKeys<HookData<TBot>[THookType]>]: CommonHandlerProps<TBot> & {
      data: HookData<TBot>[THookType][THookDataName]
    }
  }
}

export type HookOutputs<TBot extends common.BaseBot> = {
  [THookType in utils.StringKeys<HookData<TBot>>]: {
    [THookDataName in utils.StringKeys<HookData<TBot>[THookType]>]: {
      data?: HookData<TBot>[THookType][THookDataName]
    } & (HookDefinitions<TBot>[THookType]['stoppable'] extends true ? { stop?: boolean } : {})
  }
}

export type HookHandlers<TBot extends common.BaseBot> = {
  [THookType in utils.StringKeys<HookData<TBot>>]: {
    [THookDataName in utils.StringKeys<HookData<TBot>[THookType]>]: (
      input: HookInputs<TBot>[THookType][THookDataName]
    ) => Promise<HookOutputs<TBot>[THookType][THookDataName] | undefined>
  }
}

export type MessageHandlersMap<TBot extends common.BaseBot> = {
  [TMessageName in utils.StringKeys<IncomingMessages<TBot>>]?: MessageHandlers<TBot>[TMessageName][]
}

export type EventHandlersMap<TBot extends common.BaseBot> = {
  [TEventName in utils.StringKeys<IncomingEvents<TBot>>]?: EventHandlers<TBot>[TEventName][]
}

export type StateExpiredHandlersMap<TBot extends common.BaseBot> = {
  [TStateName in utils.StringKeys<IncomingStates<TBot>>]?: StateExpiredHandlers<TBot>[TStateName][]
}

export type HookHandlersMap<TBot extends common.BaseBot> = {
  [THookType in utils.StringKeys<HookData<TBot>>]: {
    [THookDataName in utils.StringKeys<HookData<TBot>[THookType]>]?: HookHandlers<TBot>[THookType][THookDataName][]
  }
}

export type WorkflowUpdateType = 'started' | 'continued' | 'timed_out'
export type WorkflowHandlersMap<TBot extends common.BaseBot> = {
  [TWorkflowUpdateType in WorkflowUpdateType]: {
    [TWorkflowName in utils.StringKeys<TBot['workflows']>]?: WorkflowHandlers<TBot>[TWorkflowName][]
  }
}

export type OrderedMessageHandlersMap<TBot extends common.BaseBot> = {
  [TMessageName in utils.StringKeys<IncomingMessages<TBot>>]?: {
    handler: MessageHandlers<TBot>[TMessageName]
    order: number
  }[]
}

export type OrderedEventHandlersMap<TBot extends common.BaseBot> = {
  [TEventName in utils.StringKeys<IncomingEvents<TBot>>]?: { handler: EventHandlers<TBot>[TEventName]; order: number }[]
}

export type OrderedStateExpiredHandlersMap<TBot extends common.BaseBot> = {
  [TStateName in utils.StringKeys<IncomingStates<TBot>>]?: {
    handler: StateExpiredHandlers<TBot>[TStateName]
    order: number
  }[]
}

export type OrderedHookHandlersMap<TBot extends common.BaseBot> = {
  [THookType in utils.StringKeys<HookData<TBot>>]: {
    [THookDataName in utils.StringKeys<HookData<TBot>[THookType]>]?: {
      handler: HookHandlers<TBot>[THookType][THookDataName]
      order: number
    }[]
  }
}

export type OrderedWorkflowHandlersMap<TBot extends common.BaseBot> = {
  [TWorkflowUpdateType in WorkflowUpdateType]: {
    [TWorkflowName in utils.StringKeys<TBot['workflows']>]?: {
      handler: WorkflowHandlers<TBot>[TWorkflowName]
      order: number
    }[]
  }
}

/**
 * TODO:
 * the consumer of this type shouldnt be able to access "*" directly;
 * "*" is meant the user who registers an handler, not for the user who calls the handler
 */
export type BotHandlers<TBot extends common.BaseBot> = {
  actionHandlers: ActionHandlers<TBot>
  messageHandlers: MessageHandlersMap<TBot>
  eventHandlers: EventHandlersMap<TBot>
  stateExpiredHandlers: StateExpiredHandlersMap<TBot>
  hookHandlers: HookHandlersMap<TBot>
  workflowHandlers: WorkflowHandlersMap<TBot>
}

// plugins

type _GetPluginPrefix<TKey extends string, TPlugin extends plugin.BasePlugin> = TKey extends TPlugin['name']
  ? ''
  : `${TKey}#`

type ImplementedActions<
  _TBot extends common.BaseBot,
  TPlugins extends Record<string, plugin.BasePlugin>,
> = utils.UnionToIntersection<
  utils.ValueOf<{
    [TPlugin in utils.StringKeys<TPlugins>]: {
      [TAction in utils.StringKeys<
        TPlugins[TPlugin]['actions']
      > as `${_GetPluginPrefix<utils.Cast<TPlugin, string>, TPlugins[TPlugin]>}${utils.Cast<TAction, string>}`]: TPlugins[TPlugin]['actions'][TAction]
    }
  }>
>

type UnimplementedActions<TBot extends common.BaseBot, TPlugins extends Record<string, plugin.BasePlugin>> = Omit<
  TBot['actions'],
  utils.StringKeys<ImplementedActions<TBot, TPlugins>>
>

export type ImplementedActionHandlers<
  TBot extends common.BaseBot,
  TPlugins extends Record<string, plugin.BasePlugin>,
> = {
  [K in utils.StringKeys<ImplementedActions<TBot, TPlugins>>]: ActionHandlers<TBot>[utils.Cast<
    K,
    keyof ActionHandlers<TBot>
  >]
}

export type UnimplementedActionHandlers<
  TBot extends common.BaseBot,
  TPlugins extends Record<string, plugin.BasePlugin>,
> = {
  [K in utils.StringKeys<UnimplementedActions<TBot, TPlugins>>]: ActionHandlers<TBot>[utils.Cast<
    K,
    keyof ActionHandlers<TBot>
  >]
}

export type ServerProps = Omit<CommonHandlerProps<common.BaseBot>, 'workflows'> & {
  req: Request
  self: BotHandlers<common.BaseBot>
}

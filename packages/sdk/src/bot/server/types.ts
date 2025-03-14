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
  [K in keyof common.EnumerateEvents<TBot>]: utils.Merge<
    client.Event,
    { type: K; payload: common.EnumerateEvents<TBot>[K] }
  >
}

type _IncomingMessages<TBot extends common.BaseBot> = {
  // TODO: use bot definiton message property to infer allowed tags
  [K in keyof common.GetMessages<TBot>]: utils.Merge<
    //
    client.Message,
    { type: K; payload: common.GetMessages<TBot>[K] }
  >
}

type _IncomingStates<TBot extends common.BaseBot> = {
  [K in keyof common.EnumerateStates<TBot>]: utils.Merge<
    client.State,
    { name: K; payload: common.EnumerateStates<TBot>[K] }
  >
}

type _OutgoingMessageRequests<TBot extends common.BaseBot> = {
  [K in keyof common.GetMessages<TBot>]: utils.Merge<
    client.ClientInputs['createMessage'],
    { type: K; payload: common.GetMessages<TBot>[K] }
  >
}

type _OutgoingMessageResponses<TBot extends common.BaseBot> = {
  [K in keyof common.GetMessages<TBot>]: utils.Merge<
    client.ClientOutputs['createMessage'],
    {
      message: utils.Merge<client.Message, { type: K; payload: common.GetMessages<TBot>[K] }>
    }
  >
}

type _OutgoingCallActionRequests<TBot extends common.BaseBot> = {
  [K in keyof common.EnumerateActionInputs<TBot>]: utils.Merge<
    client.ClientInputs['callAction'],
    { type: K; input: common.EnumerateActionInputs<TBot>[K] }
  >
}

type _OutgoingCallActionResponses<TBot extends common.BaseBot> = {
  [K in keyof common.EnumerateActionOutputs<TBot>]: utils.Merge<
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
  workflows: workflowProxy.WorkflowProxy<TBot>
}

export type MessagePayloads<TBot extends common.BaseBot> = {
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

export type MessageHandlers<TBot extends common.BaseBot> = {
  [K in keyof IncomingMessages<TBot>]: (args: MessagePayloads<TBot>[K]) => Promise<void>
}

export type EventPayloads<TBot extends common.BaseBot> = {
  [K in keyof IncomingEvents<TBot>]: CommonHandlerProps<TBot> & { event: IncomingEvents<TBot>[K] }
}

export type EventHandlers<TBot extends common.BaseBot> = {
  [K in keyof IncomingEvents<TBot>]: (args: EventPayloads<TBot>[K]) => Promise<void>
}

export type StateExpiredPayloads<TBot extends common.BaseBot> = {
  [K in keyof IncomingStates<TBot>]: CommonHandlerProps<TBot> & { state: IncomingStates<TBot>[K] }
}

export type StateExpiredHandlers<TBot extends common.BaseBot> = {
  [K in keyof IncomingStates<TBot>]: (args: StateExpiredPayloads<TBot>[K]) => Promise<void>
}

export type ActionHandlerPayloads<TBot extends common.BaseBot> = {
  [K in keyof TBot['actions']]: CommonHandlerProps<TBot> & { type?: K; input: TBot['actions'][K]['input'] }
}

export type ActionHandlers<TBot extends common.BaseBot> = {
  [K in keyof TBot['actions']]: (props: ActionHandlerPayloads<TBot>[K]) => Promise<TBot['actions'][K]['output']>
}

export type WorkflowUpdateType =
  | 'child_workflow_deleted'
  | 'child_workflow_finished'
  | 'workflow_timedout'
  | 'workflow_started'
  | 'workflow_continued'
export type WorkflowUpdateEventPayload = {
  type: WorkflowUpdateType
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
  [H in keyof HookDefinitions<TBot>]: {
    [T in keyof HookDefinitions<TBot>[H]['data']]: HookDefinitions<TBot>[H]['data'][T]
  }
}

export type HookInputs<TBot extends common.BaseBot> = {
  [H in keyof HookData<TBot>]: {
    [T in keyof HookData<TBot>[H]]: CommonHandlerProps<TBot> & {
      data: HookData<TBot>[H][T]
    }
  }
}

export type HookOutputs<TBot extends common.BaseBot> = {
  [H in keyof HookData<TBot>]: {
    [T in keyof HookData<TBot>[H]]: {
      data?: HookData<TBot>[H][T]
    } & (HookDefinitions<TBot>[H]['stoppable'] extends true ? { stop?: boolean } : {})
  }
}

export type HookHandlers<TBot extends common.BaseBot> = {
  [H in keyof HookData<TBot>]: {
    [T in keyof HookData<TBot>[H]]: (input: HookInputs<TBot>[H][T]) => Promise<HookOutputs<TBot>[H][T] | undefined>
  }
}

export type MessageHandlersMap<TBot extends common.BaseBot> = {
  [T in keyof IncomingMessages<TBot>]?: MessageHandlers<TBot>[T][]
}

export type EventHandlersMap<TBot extends common.BaseBot> = {
  [T in keyof IncomingEvents<TBot>]?: EventHandlers<TBot>[T][]
}

export type StateExpiredHandlersMap<TBot extends common.BaseBot> = {
  [T in keyof IncomingStates<TBot>]?: StateExpiredHandlers<TBot>[T][]
}

export type HookHandlersMap<TBot extends common.BaseBot> = {
  [H in keyof HookData<TBot>]: {
    [T in keyof HookData<TBot>[H]]?: HookHandlers<TBot>[H][T][]
  }
}

export type WorkflowPayloads<TBot extends common.BaseBot, TExtraTools extends object = {}> = {
  [WorkflowName in keyof common.EnumerateWorkflows<TBot>]: CommonHandlerProps<TBot> & {
    conversation?: client.Conversation
    user?: client.User
    workflow: workflowProxy.WorkflowWithUtilities<TBot, WorkflowName>
  } & TExtraTools
}

export type WorkflowHandlers<TBot extends common.BaseBot, TExtraTools extends object = {}> = {
  [K in keyof common.EnumerateWorkflows<TBot>]: (props: WorkflowPayloads<TBot, TExtraTools>[K]) => Promise<void>
}

export type WorkflowUpdateTypeCamelCase = 'started' | 'continued' | 'timedOut'

export type WorkflowHandlersMap<TBot extends common.BaseBot, TExtraTools extends object = {}> = {
  [UpdateType in WorkflowUpdateTypeCamelCase]?: {
    [WorkflowName in keyof common.EnumerateWorkflows<TBot>]?: WorkflowHandlers<TBot, TExtraTools>[WorkflowName][]
  }
}

export type WorkflowHandlersFnMap<TBot extends common.BaseBot, TExtraTools extends object = {}> = {
  [WorkflowName in Extract<keyof TBot['workflows'], string>]: {
    [UType in WorkflowUpdateTypeCamelCase]: (handler: WorkflowHandlers<TBot, TExtraTools>[WorkflowName]) => void
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
    [TPlugin in keyof TPlugins]: {
      [TAction in keyof TPlugins[TPlugin]['actions'] as `${_GetPluginPrefix<utils.Cast<TPlugin, string>, TPlugins[TPlugin]>}${utils.Cast<TAction, string>}`]: TPlugins[TPlugin]['actions'][TAction]
    }
  }>
>

type UnimplementedActions<TBot extends common.BaseBot, TPlugins extends Record<string, plugin.BasePlugin>> = Omit<
  TBot['actions'],
  keyof ImplementedActions<TBot, TPlugins>
>

export type ImplementedActionHandlers<
  TBot extends common.BaseBot,
  TPlugins extends Record<string, plugin.BasePlugin>,
> = {
  [K in keyof ImplementedActions<TBot, TPlugins>]: ActionHandlers<TBot>[utils.Cast<K, keyof ActionHandlers<TBot>>]
}

export type UnimplementedActionHandlers<
  TBot extends common.BaseBot,
  TPlugins extends Record<string, plugin.BasePlugin>,
> = {
  [K in keyof UnimplementedActions<TBot, TPlugins>]: ActionHandlers<TBot>[utils.Cast<K, keyof ActionHandlers<TBot>>]
}

export type ServerProps = Omit<CommonHandlerProps<common.BaseBot>, 'workflows'> & {
  req: Request
  self: BotHandlers<common.BaseBot>
}

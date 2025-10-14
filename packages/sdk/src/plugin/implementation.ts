import { Workflow } from '@botpress/client'
import type {
  MessageHandlersMap as BotMessageHandlersMap,
  EventHandlersMap as BotEventHandlersMap,
  StateExpiredHandlersMap as BotStateExpiredHandlersMap,
  HookHandlersMap as BotHookHandlersMap,
  WorkflowHandlersMap as BotWorkflowHandlersMap,
  ActionHandlersMap as BotActionHandlersMap,
  BotHandlers,
  BotSpecificClient,
  WorkflowUpdateType,
} from '../bot'
import { WorkflowProxy, proxyWorkflows, wrapWorkflowInstance } from '../bot/workflow-proxy'
import * as utils from '../utils'
import { ActionProxy, proxyActions } from './action-proxy'
import { BasePlugin, PluginConfiguration, PluginInterfaceExtensions, PluginRuntimeProps } from './common'
import { EventProxy, proxyEvents } from './event-proxy'
import { formatEventRef, parseEventRef, resolveEvent } from './interface-resolution'
import {
  ActionHandlers,
  MessageHandlers,
  EventHandlers,
  StateExpiredHandlers,
  HookHandlers,
  WorkflowHandlers,
  MessageHandlersMap,
  EventHandlersMap,
  StateExpiredHandlersMap,
  HookHandlersMap,
  WorkflowHandlersMap,
  OrderedMessageHandlersMap,
  OrderedEventHandlersMap,
  OrderedStateExpiredHandlersMap,
  OrderedHookHandlersMap,
  OrderedWorkflowHandlersMap,
  HookInputs as HookPayloads,
  IncomingMessages,
  InjectedHandlerProps,
  IncomingEvents,
  IncomingStates,
  HookData,
} from './server/types'
import { proxyStates, StateProxy } from './state-proxy'

export type PluginImplementationProps<TPlugin extends BasePlugin = BasePlugin> = {
  actions: ActionHandlers<TPlugin>
}

type Tools<TPlugin extends BasePlugin = BasePlugin> = {
  configuration: PluginConfiguration<TPlugin>
  interfaces: PluginInterfaceExtensions<TPlugin>
  actions: ActionProxy<TPlugin>
  events: EventProxy<TPlugin>
  states: StateProxy<TPlugin>
  workflows: WorkflowProxy<TPlugin>
  alias?: string
}

export class PluginImplementation<TPlugin extends BasePlugin = BasePlugin> implements BotHandlers<TPlugin> {
  private _runtimeProps: PluginRuntimeProps<TPlugin> | undefined

  private _actionHandlers: ActionHandlers<any>
  private _messageHandlers: OrderedMessageHandlersMap<any> = {}
  private _eventHandlers: OrderedEventHandlersMap<any> = {}
  private _stateExpiredHandlers: OrderedStateExpiredHandlersMap<any> = {}
  private _hookHandlers: OrderedHookHandlersMap<any> = {
    before_incoming_event: {},
    before_incoming_message: {},
    before_outgoing_message: {},
    before_outgoing_call_action: {},
    before_incoming_call_action: {},
    after_incoming_event: {},
    after_incoming_message: {},
    after_outgoing_message: {},
    after_outgoing_call_action: {},
    after_incoming_call_action: {},
  }
  private _workflowHandlers: OrderedWorkflowHandlersMap<any> = {
    started: {},
    continued: {},
    timed_out: {},
  }

  private _registerOrder: number = 0

  public constructor(public readonly props: PluginImplementationProps<TPlugin>) {
    this._actionHandlers = props.actions
  }

  public initialize(props: PluginRuntimeProps<TPlugin>): this {
    this._runtimeProps = props
    return this
  }

  private get _runtime() {
    if (!this._runtimeProps) {
      throw new Error(
        'Plugin not correctly initialized. This is likely because you access your plugin config outside of an handler.'
      )
    }
    return this._runtimeProps
  }

  private _getTools(client: BotSpecificClient<any>): Tools {
    const { configuration, interfaces, alias } = this._runtime
    const actions = proxyActions(client, this._runtime) as ActionProxy<BasePlugin>
    const states = proxyStates(client, this._runtime) as StateProxy<BasePlugin>
    const workflows = proxyWorkflows(client) as WorkflowProxy<BasePlugin>
    const events = proxyEvents(client, this._runtime) as EventProxy<BasePlugin>

    return {
      configuration,
      interfaces,
      actions,
      states,
      alias,
      workflows,
      events,
    }
  }

  public get actionHandlers(): BotActionHandlersMap<TPlugin> {
    return new Proxy(
      {},
      {
        get: <TActionName extends utils.types.StringKeys<TPlugin['actions']>>(_: unknown, actionName: TActionName) => {
          actionName = this._stripAliasPrefix(actionName) as TActionName
          const handler = this._actionHandlers[actionName]
          if (!handler) {
            return undefined
          }
          return utils.functions.setName(
            (input: Omit<Parameters<typeof handler>[0], keyof InjectedHandlerProps<TPlugin>>) =>
              handler({ ...input, ...this._getTools(input.client) }),
            handler.name
          )
        },
      }
    ) as BotActionHandlersMap<TPlugin>
  }

  public get messageHandlers(): BotMessageHandlersMap<TPlugin> {
    return new Proxy(
      {},
      {
        get: <TMessageName extends utils.types.StringKeys<IncomingMessages<TPlugin>>>(
          _: unknown,
          messageName: TMessageName
        ) => {
          messageName = this._stripAliasPrefix(messageName as string) as TMessageName
          const specificHandlers = this._messageHandlers[messageName] ?? []
          const globalHandlers = this._messageHandlers['*'] ?? []
          const allHandlers = utils.arrays
            .unique([...specificHandlers, ...globalHandlers])
            .sort((a, b) => a.order - b.order)
          return allHandlers.map(({ handler }) =>
            utils.functions.setName(
              (input: Omit<Parameters<typeof handler>[0], keyof InjectedHandlerProps<TPlugin>>) =>
                handler({ ...input, message: input.message as any, ...this._getTools(input.client) }),
              handler.name
            )
          )
        },
      }
    ) as BotMessageHandlersMap<TPlugin>
  }

  public get eventHandlers(): BotEventHandlersMap<TPlugin> {
    return new Proxy(
      {},
      {
        get: <TEventName extends utils.types.StringKeys<IncomingEvents<TPlugin>>>(
          _: unknown,
          eventName: TEventName
        ) => {
          eventName = this._stripAliasPrefix(eventName) as TEventName

          // if prop is "github:prOpened", include both "github:prOpened" and "creatable:itemCreated"

          const specificHandlers = this._eventHandlers[eventName] ?? []

          const interfaceHandlers = Object.entries(this._eventHandlers)
            .filter(([e]) => this._eventResolvesTo(e, eventName))
            .flatMap(([, handlers]: [unknown, OrderedEventHandlersMap<any>[TEventName]]) => handlers ?? [])

          const globalHandlers = this._eventHandlers['*'] ?? []
          const allHandlers = utils.arrays
            .unique([...specificHandlers, ...interfaceHandlers, ...globalHandlers])
            .sort((a, b) => a.order - b.order)

          return allHandlers.map(({ handler }) =>
            utils.functions.setName(
              (input: Omit<Parameters<typeof handler>[0], keyof InjectedHandlerProps<TPlugin>>) =>
                handler({ ...input, event: input.event as any, ...this._getTools(input.client) }),
              handler.name
            )
          )
        },
      }
    ) as BotEventHandlersMap<TPlugin>
  }

  public get stateExpiredHandlers(): BotStateExpiredHandlersMap<TPlugin> {
    return new Proxy(
      {},
      {
        get: <TStateName extends utils.types.StringKeys<IncomingStates<TPlugin>>>(
          _: unknown,
          stateName: TStateName
        ) => {
          stateName = this._stripAliasPrefix(stateName) as TStateName

          const specificHandlers = this._stateExpiredHandlers[stateName] ?? []
          const globalHandlers = this._stateExpiredHandlers['*'] ?? []
          const allHandlers = utils.arrays
            .unique([...specificHandlers, ...globalHandlers])
            .sort((a, b) => a.order - b.order)
          return allHandlers.map(({ handler }) =>
            utils.functions.setName(
              (input: Omit<Parameters<typeof handler>[0], keyof InjectedHandlerProps<TPlugin>>) =>
                handler({ ...input, state: input.state as any, ...this._getTools(input.client) }),
              handler.name
            )
          )
        },
      }
    ) as BotStateExpiredHandlersMap<TPlugin>
  }

  public get hookHandlers(): BotHookHandlersMap<TPlugin> {
    return new Proxy(
      {},
      {
        get: <THookType extends utils.types.StringKeys<HookHandlersMap<TPlugin>>>(_: unknown, hookType: THookType) => {
          const hooks = this._hookHandlers[hookType]
          if (!hooks) {
            return undefined
          }
          return new Proxy(
            {},
            {
              get: <THookDataName extends utils.types.StringKeys<HookData<TPlugin>[THookType]>>(
                _: unknown,
                hookDataName: THookDataName
              ) => {
                hookDataName = this._stripAliasPrefix(hookDataName) as THookDataName

                const specificHandlers = hooks[hookDataName] ?? []

                // for "before_incoming_event", "after_incoming_event" and other event related hooks
                const interfaceHandlers = Object.entries(hooks)
                  .filter(([e]) => this._eventResolvesTo(e, hookDataName))
                  .flatMap(([, handlers]) => handlers ?? []) as unknown as NonNullable<
                  OrderedHookHandlersMap<TPlugin>[THookType][THookDataName]
                >

                const globalHandlers = (hooks['*' as THookDataName] ?? []) as NonNullable<
                  OrderedHookHandlersMap<TPlugin>[THookType][THookDataName]
                >
                const handlers = utils.arrays
                  .unique([...specificHandlers, ...interfaceHandlers, ...globalHandlers])
                  .sort((a, b) => a.order - b.order)

                return handlers.map(({ handler }) =>
                  utils.functions.setName(
                    (input: HookPayloads<TPlugin>[THookType][THookDataName]) =>
                      handler({ ...input, data: input.data as any, ...this._getTools(input.client) }),
                    handler.name
                  )
                )
              },
            }
          )
        },
      }
    ) as BotHookHandlersMap<TPlugin>
  }

  public get workflowHandlers(): BotWorkflowHandlersMap<TPlugin> {
    return new Proxy(
      {},
      {
        get: (_, updateType: WorkflowUpdateType) => {
          const handlersOfType = this._workflowHandlers[updateType]
          if (!handlersOfType) {
            return undefined
          }

          return new Proxy(
            {},
            {
              get: (_, workflowName: string) => {
                const selfHandlers = handlersOfType[workflowName]?.sort((a, b) => a.order - b.order) ?? []

                return selfHandlers.map(({ handler }) =>
                  utils.functions.setName(
                    async (
                      input: Omit<Parameters<typeof handler>[0], keyof InjectedHandlerProps<TPlugin> | 'workflow'> & {
                        workflow: Workflow
                      }
                    ) => {
                      let currentWorkflowState = input.workflow
                      await handler({
                        ...input,
                        workflow: wrapWorkflowInstance({
                          ...input,
                          onWorkflowUpdate(newState) {
                            currentWorkflowState = newState
                          },
                        }),
                        ...this._getTools(input.client),
                      })
                      return currentWorkflowState
                    },
                    handler.name
                  )
                )
              },
            }
          )
        },
      }
    ) as BotWorkflowHandlersMap<TPlugin>
  }

  public readonly on = {
    message: <T extends utils.types.StringKeys<MessageHandlersMap<TPlugin>>>(
      type: T,
      handler: MessageHandlers<TPlugin>[T]
    ): void => {
      this._messageHandlers[type] = utils.arrays.safePush(this._messageHandlers[type], {
        handler: handler as MessageHandlers<any>[string],
        order: this._registerOrder++,
      })
    },

    event: <T extends utils.types.StringKeys<EventHandlersMap<TPlugin>>>(
      type: T,
      handler: EventHandlers<TPlugin>[T]
    ): void => {
      this._eventHandlers[type] = utils.arrays.safePush(this._eventHandlers[type], {
        handler: handler as EventHandlers<any>[string],
        order: this._registerOrder++,
      })
    },

    stateExpired: <T extends utils.types.StringKeys<StateExpiredHandlersMap<TPlugin>>>(
      type: T,
      handler: StateExpiredHandlers<TPlugin>[T]
    ): void => {
      this._stateExpiredHandlers[type] = utils.arrays.safePush(this._stateExpiredHandlers[type], {
        handler: handler as StateExpiredHandlers<any>[string],
        order: this._registerOrder++,
      })
    },

    beforeIncomingEvent: <T extends utils.types.StringKeys<HookHandlersMap<TPlugin>['before_incoming_event']>>(
      type: T,
      handler: HookHandlers<TPlugin>['before_incoming_event'][T]
    ) => {
      this._hookHandlers.before_incoming_event[type] = utils.arrays.safePush(
        this._hookHandlers.before_incoming_event[type],
        { handler: handler as HookHandlers<any>['before_incoming_event'][string], order: this._registerOrder++ }
      )
    },

    beforeIncomingMessage: <T extends utils.types.StringKeys<HookHandlersMap<TPlugin>['before_incoming_message']>>(
      type: T,
      handler: HookHandlers<TPlugin>['before_incoming_message'][T]
    ) => {
      this._hookHandlers.before_incoming_message[type] = utils.arrays.safePush(
        this._hookHandlers.before_incoming_message[type],
        { handler: handler as HookHandlers<any>['before_incoming_message'][string], order: this._registerOrder++ }
      )
    },

    beforeOutgoingMessage: <T extends utils.types.StringKeys<HookHandlersMap<TPlugin>['before_outgoing_message']>>(
      type: T,
      handler: HookHandlers<TPlugin>['before_outgoing_message'][T]
    ) => {
      this._hookHandlers.before_outgoing_message[type] = utils.arrays.safePush(
        this._hookHandlers.before_outgoing_message[type],
        { handler: handler as HookHandlers<any>['before_outgoing_message'][string], order: this._registerOrder++ }
      )
    },

    beforeOutgoingCallAction: <
      T extends utils.types.StringKeys<HookHandlersMap<TPlugin>['before_outgoing_call_action']>,
    >(
      type: T,
      handler: HookHandlers<TPlugin>['before_outgoing_call_action'][T]
    ) => {
      this._hookHandlers.before_outgoing_call_action[type] = utils.arrays.safePush(
        this._hookHandlers.before_outgoing_call_action[type],
        { handler: handler as HookHandlers<any>['before_outgoing_call_action'][string], order: this._registerOrder++ }
      )
    },

    /**
     * # EXPERIMENTAL
     * This API is experimental and may change in the future.
     */
    beforeIncomingCallAction: <
      T extends utils.types.StringKeys<HookHandlersMap<TPlugin>['before_incoming_call_action']>,
    >(
      type: T,
      handler: HookHandlers<TPlugin>['before_incoming_call_action'][T]
    ) => {
      this._hookHandlers.before_incoming_call_action[type] = utils.arrays.safePush(
        this._hookHandlers.before_incoming_call_action[type],
        { handler: handler as HookHandlers<any>['before_incoming_call_action'][string], order: this._registerOrder++ }
      )
    },

    afterIncomingEvent: <T extends utils.types.StringKeys<HookHandlersMap<TPlugin>['after_incoming_event']>>(
      type: T,
      handler: HookHandlers<TPlugin>['after_incoming_event'][T]
    ) => {
      this._hookHandlers.after_incoming_event[type] = utils.arrays.safePush(
        this._hookHandlers.after_incoming_event[type],
        { handler: handler as HookHandlers<any>['after_incoming_event'][string], order: this._registerOrder++ }
      )
    },

    afterIncomingMessage: <T extends utils.types.StringKeys<HookHandlersMap<TPlugin>['after_incoming_message']>>(
      type: T,
      handler: HookHandlers<TPlugin>['after_incoming_message'][T]
    ) => {
      this._hookHandlers.after_incoming_message[type] = utils.arrays.safePush(
        this._hookHandlers.after_incoming_message[type],
        { handler: handler as HookHandlers<any>['after_incoming_message'][string], order: this._registerOrder++ }
      )
    },

    afterOutgoingMessage: <T extends utils.types.StringKeys<HookHandlersMap<TPlugin>['after_outgoing_message']>>(
      type: T,
      handler: HookHandlers<TPlugin>['after_outgoing_message'][T]
    ) => {
      this._hookHandlers.after_outgoing_message[type] = utils.arrays.safePush(
        this._hookHandlers.after_outgoing_message[type],
        { handler: handler as HookHandlers<any>['after_outgoing_message'][string], order: this._registerOrder++ }
      )
    },

    afterOutgoingCallAction: <T extends utils.types.StringKeys<HookHandlersMap<TPlugin>['after_outgoing_call_action']>>(
      type: T,
      handler: HookHandlers<TPlugin>['after_outgoing_call_action'][T]
    ) => {
      this._hookHandlers.after_outgoing_call_action[type] = utils.arrays.safePush(
        this._hookHandlers.after_outgoing_call_action[type],
        { handler: handler as HookHandlers<any>['after_outgoing_call_action'][string], order: this._registerOrder++ }
      )
    },

    /**
     * # EXPERIMENTAL
     * This API is experimental and may change in the future.
     */
    afterIncomingCallAction: <T extends utils.types.StringKeys<HookHandlersMap<TPlugin>['after_incoming_call_action']>>(
      type: T,
      handler: HookHandlers<TPlugin>['after_incoming_call_action'][T]
    ) => {
      this._hookHandlers.after_incoming_call_action[type] = utils.arrays.safePush(
        this._hookHandlers.after_incoming_call_action[type],
        { handler: handler as HookHandlers<any>['after_incoming_call_action'][string], order: this._registerOrder++ }
      )
    },

    /**
     * # EXPERIMENTAL
     * This API is experimental and may change in the future.
     */
    workflowStart: <T extends utils.types.StringKeys<WorkflowHandlersMap<TPlugin>['started']>>(
      type: T,
      handler: WorkflowHandlers<TPlugin>[T]
    ): void => {
      this._workflowHandlers.started[type] = utils.arrays.safePush(this._workflowHandlers.started[type], {
        handler: handler as WorkflowHandlers<any>[string],
        order: this._registerOrder++,
      })
    },

    /**
     * # EXPERIMENTAL
     * This API is experimental and may change in the future.
     */
    workflowContinue: <T extends utils.types.StringKeys<WorkflowHandlersMap<TPlugin>['continued']>>(
      type: T,
      handler: WorkflowHandlers<TPlugin>[T]
    ): void => {
      this._workflowHandlers.continued[type] = utils.arrays.safePush(this._workflowHandlers.continued[type], {
        handler: handler as WorkflowHandlers<any>[string],
        order: this._registerOrder++,
      })
    },

    /**
     * # EXPERIMENTAL
     * This API is experimental and may change in the future.
     */
    workflowTimeout: <T extends utils.types.StringKeys<WorkflowHandlersMap<TPlugin>['timed_out']>>(
      type: T,
      handler: WorkflowHandlers<TPlugin>[T]
    ): void => {
      this._workflowHandlers.timed_out[type] = utils.arrays.safePush(this._workflowHandlers.timed_out[type], {
        handler: handler as WorkflowHandlers<any>[string],
        order: this._registerOrder++,
      })
    },
  }

  /**
   * checks if the actual event resolves to the target event
   */
  private _eventResolvesTo = (actualEventRef: string, targetEventRef: string) => {
    const parsedRef = parseEventRef(actualEventRef)
    if (!parsedRef) {
      return false
    }
    const resolvedRef = resolveEvent(parsedRef, this._runtime.interfaces)
    const formattedRef = formatEventRef(resolvedRef)
    return formattedRef === targetEventRef
  }

  private _stripAliasPrefix = (prop: string) => {
    const { alias } = this._runtime
    if (!alias) {
      return prop
    }
    const prefix = `${alias}#`
    return prop.startsWith(prefix) ? prop.slice(prefix.length) : prop
  }
}

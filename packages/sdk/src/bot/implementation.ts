import type { Server } from 'node:http'
import { PLUGIN_PREFIX_SEPARATOR } from '../consts'
import { BasePlugin, PluginImplementation } from '../plugin'
import { serve } from '../serve'
import * as utils from '../utils'
import { BaseBot } from './common'
import {
  botHandler,
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
  BotHandlers,
  UnimplementedActionHandlers,
  WorkflowUpdateType,
  InjectedHandlerProps,
  InjectedBotHandlers,
} from './server'
import { proxyWorkflows, wrapWorkflowInstance } from './workflow-proxy'

export type BotImplementationProps<TBot extends BaseBot = BaseBot, TPlugins extends Record<string, BasePlugin> = {}> = {
  actions: UnimplementedActionHandlers<TBot, TPlugins>
  plugins: {
    [K in utils.types.StringKeys<TPlugins>]: PluginImplementation<TPlugins[K]>
  }
}

export class BotImplementation<TBot extends BaseBot = BaseBot, TPlugins extends Record<string, BasePlugin> = {}>
  implements InjectedBotHandlers<TBot>
{
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

  private _plugins: Record<string, PluginImplementation<any>> = {}

  private _registerOrder: number = 0

  public constructor(public readonly props: BotImplementationProps<TBot, TPlugins>) {
    this._actionHandlers = props.actions as ActionHandlers<TBot>
    this._plugins = props.plugins
  }

  public get actionHandlers(): InjectedBotHandlers<TBot>['actionHandlers'] {
    return new Proxy(
      {},
      {
        get: (_, actionName: string) => {
          let action = this._actionHandlers[actionName]
          if (action) {
            return action
          }

          for (const [pluginAlias, plugin] of Object.entries(this._plugins)) {
            const [actionPrefix, nameWithoutPrefix] = actionName.split(PLUGIN_PREFIX_SEPARATOR)
            if (actionPrefix !== pluginAlias || !nameWithoutPrefix) {
              continue
            }
            action = plugin.actionHandlers[nameWithoutPrefix]
            if (action) {
              return utils.functions.setName(
                (props: Omit<Parameters<NonNullable<typeof action>>[0], keyof InjectedHandlerProps<TBot>>) =>
                  action!({ ...props, workflows: proxyWorkflows(props.client) }),
                action.name
              )
            }
          }

          return undefined
        },
      }
    ) as InjectedBotHandlers<TBot>['actionHandlers']
  }

  public get messageHandlers(): InjectedBotHandlers<TBot>['messageHandlers'] {
    return new Proxy(
      {},
      {
        /** returns both the message handlers for the target type but global as well */
        get: (_, messageName: string) => {
          const pluginHandlers = Object.values(this._plugins).flatMap(
            (plugin) => plugin.messageHandlers[messageName] ?? []
          )
          const selfSpecificHandlers = this._messageHandlers[messageName] ?? []
          const selfGlobalHandlers = this._messageHandlers['*'] ?? []
          const selfHandlers = [...selfSpecificHandlers, ...selfGlobalHandlers]
            .sort((a, b) => a.order - b.order)
            .map(({ handler }) => handler)
          return utils.arrays
            .unique([...pluginHandlers, ...selfHandlers])
            .map((handler) =>
              utils.functions.setName(
                (props: Omit<Parameters<typeof handler>[0], keyof InjectedHandlerProps<TBot>>) =>
                  handler({ ...props, workflows: proxyWorkflows(props.client) }),
                handler.name
              )
            )
        },
      }
    ) as InjectedBotHandlers<TBot>['messageHandlers']
  }

  public get eventHandlers(): InjectedBotHandlers<TBot>['eventHandlers'] {
    return new Proxy(
      {},
      {
        /** returns both the event handlers for the target type but global as well */
        get: (_, eventName: string) => {
          const pluginHandlers = Object.values(this._plugins).flatMap((plugin) => plugin.eventHandlers[eventName] ?? [])
          const selfSpecificHandlers = this._eventHandlers[eventName as keyof EventHandlersMap<TBot>] ?? []
          const selfGlobalHandlers = this._eventHandlers['*'] ?? []
          const selfHandlers = [...selfSpecificHandlers, ...selfGlobalHandlers]
            .sort((a, b) => a.order - b.order)
            .map(({ handler }) => handler)
          return utils.arrays
            .unique([...pluginHandlers, ...selfHandlers])
            .map((handler) =>
              utils.functions.setName(
                (props: Omit<Parameters<typeof handler>[0], keyof InjectedHandlerProps<TBot>>) =>
                  handler({ ...props, workflows: proxyWorkflows(props.client) }),
                handler.name
              )
            )
        },
      }
    ) as InjectedBotHandlers<TBot>['eventHandlers']
  }

  public get stateExpiredHandlers(): InjectedBotHandlers<TBot>['stateExpiredHandlers'] {
    return new Proxy(
      {},
      {
        /** returns both the state expired handlers for the target type but global as well */
        get: (_, stateName: string) => {
          const pluginHandlers = Object.values(this._plugins).flatMap(
            (plugin) => plugin.stateExpiredHandlers[stateName] ?? []
          )
          const selfSpecificHandlers =
            this._stateExpiredHandlers[stateName as keyof StateExpiredHandlersMap<TBot>] ?? []
          const selfGlobalHandlers = this._stateExpiredHandlers['*'] ?? []
          const selfHandlers = [...selfSpecificHandlers, ...selfGlobalHandlers]
            .sort((a, b) => a.order - b.order)
            .map(({ handler }) => handler)
          return utils.arrays
            .unique([...pluginHandlers, ...selfHandlers])
            .map((handler) =>
              utils.functions.setName(
                (props: Omit<Parameters<typeof handler>[0], keyof InjectedHandlerProps<TBot>>) =>
                  handler({ ...props, workflows: proxyWorkflows(props.client) }),
                handler.name
              )
            )
        },
      }
    ) as InjectedBotHandlers<TBot>['stateExpiredHandlers']
  }

  public get hookHandlers(): InjectedBotHandlers<TBot>['hookHandlers'] {
    return new Proxy(
      {},
      {
        get: (_, hookType: utils.types.StringKeys<HookHandlersMap<TBot>>) => {
          const hooks = this._hookHandlers[hookType]
          if (!hooks) {
            return undefined
          }

          return new Proxy(
            {},
            {
              get: (_, hookDataName: string) => {
                const pluginHandlers = Object.values(this._plugins).flatMap(
                  (plugin) => plugin.hookHandlers[hookType]?.[hookDataName] ?? ([] as typeof selfHandlers)
                )

                const selfHooks = this._hookHandlers[hookType] ?? {}
                const selfSpecificHandlers = selfHooks[hookDataName] ?? []
                const selfGlobalHandlers = selfHooks['*'] ?? []
                const selfHandlers = [...selfSpecificHandlers, ...selfGlobalHandlers]
                  .sort((a, b) => a.order - b.order)
                  .map(({ handler }) => handler)

                return utils.arrays
                  .unique([...pluginHandlers, ...selfHandlers])
                  .map((handler) =>
                    utils.functions.setName(
                      (props: any) => handler({ ...props, workflows: proxyWorkflows(props.client) }),
                      handler.name
                    )
                  )
              },
            }
          )
        },
      }
    ) as InjectedBotHandlers<TBot>['hookHandlers']
  }

  public get workflowHandlers(): InjectedBotHandlers<TBot>['workflowHandlers'] {
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
                const selfHandlers =
                  handlersOfType[workflowName]?.sort((a, b) => a.order - b.order).map(({ handler }) => handler) ?? []

                const pluginHandlers = Object.values(this._plugins).flatMap(
                  (plugin) => plugin.workflowHandlers[updateType]?.[workflowName] ?? []
                )

                return utils.arrays.unique([...selfHandlers, ...pluginHandlers]).map((handler) =>
                  utils.functions.setName(
                    async (props: Omit<Parameters<typeof handler>[0], keyof InjectedHandlerProps<TBot>>) => {
                      let currentWorkflowState = props.workflow
                      await handler({
                        ...props,
                        workflow: wrapWorkflowInstance({
                          ...props,
                          onWorkflowUpdate(newState) {
                            currentWorkflowState = newState
                          },
                        }),
                        workflows: proxyWorkflows(props.client),
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
    ) as InjectedBotHandlers<TBot>['workflowHandlers']
  }

  public readonly on = {
    message: <T extends utils.types.StringKeys<MessageHandlersMap<TBot>>>(
      type: T,
      handler: MessageHandlers<TBot>[T]
    ): void => {
      this._messageHandlers[type] = utils.arrays.safePush(this._messageHandlers[type], {
        handler: handler as MessageHandlers<any>[string],
        order: this._registerOrder++,
      })
    },

    event: <T extends utils.types.StringKeys<EventHandlersMap<TBot>>>(
      type: T,
      handler: EventHandlers<TBot>[T]
    ): void => {
      this._eventHandlers[type] = utils.arrays.safePush(this._eventHandlers[type], {
        handler: handler as EventHandlers<any>[string],
        order: this._registerOrder++,
      })
    },
    stateExpired: <T extends utils.types.StringKeys<StateExpiredHandlersMap<TBot>>>(
      type: T,
      handler: StateExpiredHandlers<TBot>[T]
    ): void => {
      this._stateExpiredHandlers[type] = utils.arrays.safePush(this._stateExpiredHandlers[type], {
        handler: handler as StateExpiredHandlers<any>[string],
        order: this._registerOrder++,
      })
    },
    beforeIncomingEvent: <T extends utils.types.StringKeys<HookHandlersMap<TBot>['before_incoming_event']>>(
      type: T,
      handler: HookHandlers<TBot>['before_incoming_event'][T]
    ) => {
      this._hookHandlers.before_incoming_event[type] = utils.arrays.safePush(
        this._hookHandlers.before_incoming_event[type],
        { handler: handler as HookHandlers<any>['before_incoming_event'][string], order: this._registerOrder++ }
      )
    },
    beforeIncomingMessage: <T extends utils.types.StringKeys<HookHandlersMap<TBot>['before_incoming_message']>>(
      type: T,
      handler: HookHandlers<TBot>['before_incoming_message'][T]
    ) => {
      this._hookHandlers.before_incoming_message[type] = utils.arrays.safePush(
        this._hookHandlers.before_incoming_message[type],
        { handler: handler as HookHandlers<any>['before_incoming_message'][string], order: this._registerOrder++ }
      )
    },
    beforeOutgoingMessage: <T extends utils.types.StringKeys<HookHandlersMap<TBot>['before_outgoing_message']>>(
      type: T,
      handler: HookHandlers<TBot>['before_outgoing_message'][T]
    ) => {
      this._hookHandlers.before_outgoing_message[type] = utils.arrays.safePush(
        this._hookHandlers.before_outgoing_message[type],
        { handler: handler as HookHandlers<any>['before_outgoing_message'][string], order: this._registerOrder++ }
      )
    },
    beforeOutgoingCallAction: <T extends utils.types.StringKeys<HookHandlersMap<TBot>['before_outgoing_call_action']>>(
      type: T,
      handler: HookHandlers<TBot>['before_outgoing_call_action'][T]
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
    beforeIncomingCallAction: <T extends utils.types.StringKeys<HookHandlersMap<TBot>['before_incoming_call_action']>>(
      type: T,
      handler: HookHandlers<TBot>['before_incoming_call_action'][T]
    ) => {
      this._hookHandlers.before_incoming_call_action[type] = utils.arrays.safePush(
        this._hookHandlers.before_incoming_call_action[type],
        { handler: handler as HookHandlers<any>['before_incoming_call_action'][string], order: this._registerOrder++ }
      )
    },
    afterIncomingEvent: <T extends utils.types.StringKeys<HookHandlersMap<TBot>['after_incoming_event']>>(
      type: T,
      handler: HookHandlers<TBot>['after_incoming_event'][T]
    ) => {
      this._hookHandlers.after_incoming_event[type] = utils.arrays.safePush(
        this._hookHandlers.after_incoming_event[type],
        { handler: handler as HookHandlers<any>['after_incoming_event'][string], order: this._registerOrder++ }
      )
    },
    afterIncomingMessage: <T extends utils.types.StringKeys<HookHandlersMap<TBot>['after_incoming_message']>>(
      type: T,
      handler: HookHandlers<TBot>['after_incoming_message'][T]
    ) => {
      this._hookHandlers.after_incoming_message[type] = utils.arrays.safePush(
        this._hookHandlers.after_incoming_message[type],
        { handler: handler as HookHandlers<any>['after_incoming_message'][string], order: this._registerOrder++ }
      )
    },
    afterOutgoingMessage: <T extends utils.types.StringKeys<HookHandlersMap<TBot>['after_outgoing_message']>>(
      type: T,
      handler: HookHandlers<TBot>['after_outgoing_message'][T]
    ) => {
      this._hookHandlers.after_outgoing_message[type] = utils.arrays.safePush(
        this._hookHandlers.after_outgoing_message[type],
        { handler: handler as HookHandlers<any>['after_outgoing_message'][string], order: this._registerOrder++ }
      )
    },
    afterOutgoingCallAction: <T extends utils.types.StringKeys<HookHandlersMap<TBot>['after_outgoing_call_action']>>(
      type: T,
      handler: HookHandlers<TBot>['after_outgoing_call_action'][T]
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
    afterIncomingCallAction: <T extends utils.types.StringKeys<HookHandlersMap<TBot>['after_incoming_call_action']>>(
      type: T,
      handler: HookHandlers<TBot>['after_incoming_call_action'][T]
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
    workflowStart: <T extends utils.types.StringKeys<WorkflowHandlersMap<TBot>['started']>>(
      type: T,
      handler: WorkflowHandlers<TBot>[T]
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
    workflowContinue: <T extends utils.types.StringKeys<WorkflowHandlersMap<TBot>['continued']>>(
      type: T,
      handler: WorkflowHandlers<TBot>[T]
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
    workflowTimeout: <T extends utils.types.StringKeys<WorkflowHandlersMap<TBot>['timed_out']>>(
      type: T,
      handler: WorkflowHandlers<TBot>[T]
    ): void => {
      this._workflowHandlers.timed_out[type] = utils.arrays.safePush(this._workflowHandlers.timed_out[type], {
        handler: handler as WorkflowHandlers<any>[string],
        order: this._registerOrder++,
      })
    },
  }

  public readonly handler = botHandler(this as unknown as BotHandlers<any>)

  public readonly start = (port?: number): Promise<Server> => serve(this.handler, port)
}

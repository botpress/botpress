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
import { BasePlugin, PluginRuntimeProps } from './common'
import { ConversationFinder, proxyConversation, proxyConversations } from './conversation-proxy'
import { EventProxy, proxyEvents } from './event-proxy'
import { proxyMessage, proxyMessages } from './message-proxy'
import {
  ActionHandlers,
  MessageHandlers,
  EventHandlers,
  StateExpiredHandlers,
  HookHandlers,
  WorkflowHandlers,
  HookHandlersMap,
  WorkflowHandlersMap,
  OrderedMessageHandlersMap,
  OrderedEventHandlersMap,
  OrderedStateExpiredHandlersMap,
  OrderedHookHandlersMap,
  OrderedWorkflowHandlersMap,
  HookInputsWithoutInjectedProps,
  ActionHandlerPayloadsWithoutInjectedProps,
  StateExpiredPayloadsWithoutInjectedProps,
  MessagePayloadsWithoutInjectedProps,
  EventPayloadsWithoutInjectedProps,
  WorkflowPayloadsWithoutInjectedProps,
  InjectedHandlerProps,
} from './server/types'
import { proxyStates, StateProxy } from './state-proxy'
import { unprefixTagsOwnedByPlugin } from './tag-prefixer'
import { proxyUser, proxyUsers, type UserFinder } from './user-proxy'

export type PluginImplementationProps<TPlugin extends BasePlugin = BasePlugin> = {
  actions: ActionHandlers<TPlugin>
}

type Tools<TPlugin extends BasePlugin = BasePlugin> = InjectedHandlerProps<TPlugin>

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
    const { configuration, interfaces, integrations, alias } = this._runtime
    const actions = proxyActions(client, this._runtime) as ActionProxy<BasePlugin>
    const states = proxyStates(client, this._runtime) as StateProxy<BasePlugin>
    const workflows = proxyWorkflows({ client, pluginAlias: this._runtime.alias }) as WorkflowProxy<BasePlugin>
    const events = proxyEvents(client, this._runtime) as EventProxy<BasePlugin>
    const users = proxyUsers({ client, pluginAlias: this._runtime.alias }) as UserFinder<BasePlugin>
    const conversations = proxyConversations({ client, plugin: this._runtime }) as ConversationFinder<BasePlugin>
    const messages = proxyMessages({ client, plugin: this._runtime })

    return {
      configuration,
      interfaces,
      integrations,
      actions,
      states,
      alias,
      workflows,
      events,
      users,
      conversations,
      messages,
    }
  }

  public get actionHandlers(): BotActionHandlersMap<TPlugin> {
    return new Proxy(
      {},
      {
        get: (_: unknown, actionName: string) => {
          actionName = this._stripAliasPrefix(actionName)
          const handler = this._actionHandlers[actionName]
          if (!handler) {
            return undefined
          }
          return utils.functions.setName(
            (input: utils.types.ValueOf<ActionHandlerPayloadsWithoutInjectedProps<TPlugin>>) =>
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
        get: (_: unknown, messageName: string) => {
          messageName = this._stripAliasPrefix(messageName as string)
          const specificHandlers = messageName === '*' ? [] : (this._messageHandlers[messageName] ?? [])
          const globalHandlers = this._messageHandlers['*'] ?? []
          const allHandlers = utils.arrays
            .unique([...specificHandlers, ...globalHandlers])
            .sort((a, b) => a.order - b.order)
          return allHandlers.map(({ handler }) =>
            utils.functions.setName(
              (input: utils.types.ValueOf<MessagePayloadsWithoutInjectedProps<TPlugin>>) =>
                handler({
                  ...input,
                  user: proxyUser({
                    ...input,
                    conversationId: input.conversation.id,
                    pluginAlias: this._runtime.alias,
                  }),
                  message: proxyMessage<BasePlugin>({
                    ...input,
                    plugin: this._runtime,
                    message: input.message,
                  }),
                  conversation: proxyConversation({
                    ...input,
                    plugin: this._runtime,
                    conversation: input.conversation,
                  }),
                  ...this._getTools(input.client),
                }),
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
        get: (_: unknown, eventName: string) => {
          eventName = this._stripAliasPrefix(eventName)

          // if prop is "github:prOpened", include both "github:prOpened" and "creatable:itemCreated"

          const specificHandlers = eventName === '*' ? [] : (this._eventHandlers[eventName] ?? [])

          const interfaceHandlers = Object.entries(this._eventHandlers)
            .filter(([e]) => this._eventResolvesTo(e, eventName))
            .flatMap(([, handlers]) => handlers ?? [])

          const globalHandlers = this._eventHandlers['*'] ?? []
          const allHandlers = utils.arrays
            .unique([...specificHandlers, ...interfaceHandlers, ...globalHandlers])
            .sort((a, b) => a.order - b.order)

          return allHandlers.map(({ handler }) =>
            utils.functions.setName(
              (input: utils.types.ValueOf<EventPayloadsWithoutInjectedProps<TPlugin>>) =>
                handler({ ...input, ...this._getTools(input.client) }),
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
        get: (_: unknown, stateName: string) => {
          stateName = this._stripAliasPrefix(stateName)

          const specificHandlers = stateName === '*' ? [] : (this._stateExpiredHandlers[stateName] ?? [])
          const globalHandlers = this._stateExpiredHandlers['*'] ?? []
          const allHandlers = utils.arrays
            .unique([...specificHandlers, ...globalHandlers])
            .sort((a, b) => a.order - b.order)
          return allHandlers.map(({ handler }) =>
            utils.functions.setName(
              (input: utils.types.ValueOf<StateExpiredPayloadsWithoutInjectedProps<TPlugin>>) =>
                handler({ ...input, ...this._getTools(input.client) }),
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
        get: (_, hookType: utils.types.StringKeys<HookHandlersMap<TPlugin>>) => {
          const hooks = this._hookHandlers[hookType]
          if (!hooks) {
            return undefined
          }
          return new Proxy(
            {},
            {
              get: (_: unknown, hookDataName: string) => {
                hookDataName = this._stripAliasPrefix(hookDataName)

                const specificHandlers = hookDataName === '*' ? [] : (hooks[hookDataName] ?? [])

                // for "before_incoming_event", "after_incoming_event" and other event related hooks
                const interfaceHandlers = Object.entries(hooks)
                  .filter(([e]) => this._eventResolvesTo(e, hookDataName))
                  .flatMap(([, handlers]) => handlers ?? [])

                const globalHandlers = hooks['*'] ?? []
                const handlers = utils.arrays
                  .unique([...specificHandlers, ...interfaceHandlers, ...globalHandlers])
                  .sort((a, b) => a.order - b.order)

                return handlers.map(({ handler }) =>
                  utils.functions.setName(
                    (input: utils.types.ValueOf<HookInputsWithoutInjectedProps<TPlugin>>['*']) =>
                      handler({
                        ...input,
                        data: unprefixTagsOwnedByPlugin(input.data, { alias: this._runtime.alias }),
                        ...this._getTools(input.client),
                      }),
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
                    async (input: utils.types.ValueOf<WorkflowPayloadsWithoutInjectedProps<TPlugin>>) => {
                      let currentWorkflowState = input.workflow
                      await handler({
                        ...input,
                        workflow: wrapWorkflowInstance({
                          ...input,
                          workflow: currentWorkflowState,
                          onWorkflowUpdate(newState) {
                            currentWorkflowState = newState
                          },
                          pluginAlias: this._runtime.alias,
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
    message: <T extends utils.types.StringKeys<MessageHandlers<TPlugin>>>(
      type: T,
      handler: MessageHandlers<TPlugin>[T]
    ): void => {
      this._messageHandlers[type] = utils.arrays.safePush(this._messageHandlers[type], {
        handler: handler as unknown as MessageHandlers<any>[string],
        order: this._registerOrder++,
      })
    },

    event: <T extends utils.types.StringKeys<EventHandlers<TPlugin>>>(
      type: T,
      handler: EventHandlers<TPlugin>[T]
    ): void => {
      this._eventHandlers[type] = utils.arrays.safePush(this._eventHandlers[type], {
        handler: handler as unknown as EventHandlers<any>[string],
        order: this._registerOrder++,
      })
    },

    stateExpired: <T extends utils.types.StringKeys<StateExpiredHandlers<TPlugin>>>(
      type: T,
      handler: StateExpiredHandlers<TPlugin>[T]
    ): void => {
      this._stateExpiredHandlers[type] = utils.arrays.safePush(this._stateExpiredHandlers[type], {
        handler: handler as unknown as StateExpiredHandlers<any>[string],
        order: this._registerOrder++,
      })
    },

    beforeIncomingEvent: <T extends utils.types.StringKeys<HookHandlersMap<TPlugin>['before_incoming_event']>>(
      type: T,
      handler: HookHandlers<TPlugin>['before_incoming_event'][T]
    ) => {
      this._hookHandlers.before_incoming_event[type] = utils.arrays.safePush(
        this._hookHandlers.before_incoming_event[type],
        {
          handler: handler as unknown as HookHandlers<any>['before_incoming_event'][string],
          order: this._registerOrder++,
        }
      )
    },

    beforeIncomingMessage: <T extends utils.types.StringKeys<HookHandlersMap<TPlugin>['before_incoming_message']>>(
      type: T,
      handler: HookHandlers<TPlugin>['before_incoming_message'][T]
    ) => {
      this._hookHandlers.before_incoming_message[type] = utils.arrays.safePush(
        this._hookHandlers.before_incoming_message[type],
        {
          handler: handler as unknown as HookHandlers<any>['before_incoming_message'][string],
          order: this._registerOrder++,
        }
      )
    },

    beforeOutgoingMessage: <T extends utils.types.StringKeys<HookHandlersMap<TPlugin>['before_outgoing_message']>>(
      type: T,
      handler: HookHandlers<TPlugin>['before_outgoing_message'][T]
    ) => {
      this._hookHandlers.before_outgoing_message[type] = utils.arrays.safePush(
        this._hookHandlers.before_outgoing_message[type],
        {
          handler: handler as unknown as HookHandlers<any>['before_outgoing_message'][string],
          order: this._registerOrder++,
        }
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
        {
          handler: handler as unknown as HookHandlers<any>['before_outgoing_call_action'][string],
          order: this._registerOrder++,
        }
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
        {
          handler: handler as unknown as HookHandlers<any>['before_incoming_call_action'][string],
          order: this._registerOrder++,
        }
      )
    },

    afterIncomingEvent: <T extends utils.types.StringKeys<HookHandlersMap<TPlugin>['after_incoming_event']>>(
      type: T,
      handler: HookHandlers<TPlugin>['after_incoming_event'][T]
    ) => {
      this._hookHandlers.after_incoming_event[type] = utils.arrays.safePush(
        this._hookHandlers.after_incoming_event[type],
        {
          handler: handler as unknown as HookHandlers<any>['after_incoming_event'][string],
          order: this._registerOrder++,
        }
      )
    },

    afterIncomingMessage: <T extends utils.types.StringKeys<HookHandlersMap<TPlugin>['after_incoming_message']>>(
      type: T,
      handler: HookHandlers<TPlugin>['after_incoming_message'][T]
    ) => {
      this._hookHandlers.after_incoming_message[type] = utils.arrays.safePush(
        this._hookHandlers.after_incoming_message[type],
        {
          handler: handler as unknown as HookHandlers<any>['after_incoming_message'][string],
          order: this._registerOrder++,
        }
      )
    },

    afterOutgoingMessage: <T extends utils.types.StringKeys<HookHandlersMap<TPlugin>['after_outgoing_message']>>(
      type: T,
      handler: HookHandlers<TPlugin>['after_outgoing_message'][T]
    ) => {
      this._hookHandlers.after_outgoing_message[type] = utils.arrays.safePush(
        this._hookHandlers.after_outgoing_message[type],
        {
          handler: handler as unknown as HookHandlers<any>['after_outgoing_message'][string],
          order: this._registerOrder++,
        }
      )
    },

    afterOutgoingCallAction: <T extends utils.types.StringKeys<HookHandlersMap<TPlugin>['after_outgoing_call_action']>>(
      type: T,
      handler: HookHandlers<TPlugin>['after_outgoing_call_action'][T]
    ) => {
      this._hookHandlers.after_outgoing_call_action[type] = utils.arrays.safePush(
        this._hookHandlers.after_outgoing_call_action[type],
        {
          handler: handler as unknown as HookHandlers<any>['after_outgoing_call_action'][string],
          order: this._registerOrder++,
        }
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
        {
          handler: handler as unknown as HookHandlers<any>['after_incoming_call_action'][string],
          order: this._registerOrder++,
        }
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
        handler: handler as unknown as WorkflowHandlers<any>[string],
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
        handler: handler as unknown as WorkflowHandlers<any>[string],
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
        handler: handler as unknown as WorkflowHandlers<any>[string],
        order: this._registerOrder++,
      })
    },
  }

  /**
   * checks if the actual event resolves to the target event
   */
  private _eventResolvesTo = (actualEventRef: string, targetEventRef: string) => {
    const NAMESPACE_SEPARATOR = ':'
    const [pluginIfaceOrIntAlias, ifaceOrIntEvent] = actualEventRef.split(NAMESPACE_SEPARATOR)
    if (!pluginIfaceOrIntAlias || !ifaceOrIntEvent) {
      return false
    }

    // match '<plugin-iface-alias>:<iface-event>' => '<bot-int-alias>:<int-event>':
    const iface = this._runtime.interfaces[pluginIfaceOrIntAlias]

    if (
      iface &&
      targetEventRef === `${iface.integrationAlias}${NAMESPACE_SEPARATOR}${iface?.events?.[ifaceOrIntEvent]?.name}`
    ) {
      return true
    }

    const integration = this._runtime.integrations[pluginIfaceOrIntAlias]

    // match '<plugin-int-alias>:<int-event>' => '<bot-int-alias>:<int-event>':
    if (integration && targetEventRef === `${integration.integrationAlias}${NAMESPACE_SEPARATOR}${ifaceOrIntEvent}`) {
      return true
    }

    return false
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

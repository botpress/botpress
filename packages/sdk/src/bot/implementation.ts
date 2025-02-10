import type { Server } from 'node:http'
import { BasePlugin, PluginImplementation } from '../plugin'
import { serve } from '../serve'
import * as utils from '../utils'
import {
  botHandler,
  MessageHandlersMap,
  MessageHandlers,
  EventHandlersMap,
  EventHandlers,
  StateExpiredHandlersMap,
  StateExpiredHandlers,
  HookHandlersMap,
  HookData,
  HookHandlers,
  ActionHandlers,
  BotHandlers,
  UnimplementedActionHandlers,
} from './server'
import { BaseBot } from './types'

export type BotImplementationProps<TBot extends BaseBot = BaseBot, TPlugins extends Record<string, BasePlugin> = {}> = {
  actions: UnimplementedActionHandlers<TBot, TPlugins>
  plugins: {
    [K in keyof TPlugins]: PluginImplementation<TPlugins[K]>
  }
}

export class BotImplementation<TBot extends BaseBot = BaseBot, TPlugins extends Record<string, BasePlugin> = {}>
  implements BotHandlers<TBot>
{
  private _actionHandlers: ActionHandlers<any>
  private _messageHandlers: MessageHandlersMap<any> = {}
  private _eventHandlers: EventHandlersMap<any> = {}
  private _stateExpiredHandlers: StateExpiredHandlersMap<any> = {}
  private _hookHandlers: HookHandlersMap<any> = {
    before_incoming_event: {},
    before_incoming_message: {},
    before_outgoing_message: {},
    before_outgoing_call_action: {},
    after_incoming_event: {},
    after_incoming_message: {},
    after_outgoing_message: {},
    after_outgoing_call_action: {},
  }

  private _plugins: Record<string, PluginImplementation<any>> = {}

  public constructor(public readonly props: BotImplementationProps<TBot, TPlugins>) {
    this._actionHandlers = props.actions as ActionHandlers<TBot>
    this._plugins = props.plugins
  }

  public get actionHandlers(): ActionHandlers<TBot> {
    const selfActionHandlers = this._actionHandlers as ActionHandlers<TBot>
    const pluginActionHandlers = Object.values(this._plugins).reduce((acc, plugin) => {
      return { ...acc, ...plugin.actionHandlers }
    }, {} as ActionHandlers<TBot>)
    return { ...selfActionHandlers, ...pluginActionHandlers }
  }

  public get messageHandlers(): MessageHandlersMap<TBot> {
    return new Proxy(
      {},
      {
        /** returns both the message handlers for the target type but global as well */
        get: (_, prop: string) => {
          const selfSpecificHandlers = this._messageHandlers[prop as keyof MessageHandlersMap<TBot>] ?? []
          const selfGlobalHandlers = this._messageHandlers['*'] ?? []
          const selfHandlers = [...selfSpecificHandlers, ...selfGlobalHandlers]
          const pluginHandlers = Object.values(this._plugins).flatMap((plugin) => plugin.messageHandlers[prop] ?? [])
          return utils.arrays.unique([...selfHandlers, ...pluginHandlers])
        },
      }
    ) as MessageHandlersMap<TBot>
  }

  public get eventHandlers(): EventHandlersMap<TBot> {
    return new Proxy(
      {},
      {
        /** returns both the event handlers for the target type but global as well */
        get: (_, prop: string) => {
          const selfSpecificHandlers = this._eventHandlers[prop as keyof EventHandlersMap<TBot>] ?? []
          const selfGlobalHandlers = this._eventHandlers['*'] ?? []
          const selfHandlers = [...selfSpecificHandlers, ...selfGlobalHandlers]
          const pluginHandlers = Object.values(this._plugins).flatMap((plugin) => plugin.eventHandlers[prop] ?? [])
          return utils.arrays.unique([...selfHandlers, ...pluginHandlers])
        },
      }
    ) as EventHandlersMap<TBot>
  }

  public get stateExpiredHandlers(): StateExpiredHandlersMap<TBot> {
    return new Proxy(
      {},
      {
        /** returns both the state expired handlers for the target type but global as well */
        get: (_, prop: string) => {
          const selfSpecificHandlers = this._stateExpiredHandlers[prop as keyof StateExpiredHandlersMap<TBot>] ?? []
          const selfGlobalHandlers = this._stateExpiredHandlers['*'] ?? []
          const selfHandlers = [...selfSpecificHandlers, ...selfGlobalHandlers]
          const pluginHandlers = Object.values(this._plugins).flatMap(
            (plugin) => plugin.stateExpiredHandlers[prop] ?? []
          )
          return utils.arrays.unique([...selfHandlers, ...pluginHandlers])
        },
      }
    ) as StateExpiredHandlersMap<TBot>
  }

  public get hookHandlers(): HookHandlersMap<TBot> {
    return new Proxy(
      {},
      {
        get: (_, prop1: string) => {
          return new Proxy(
            {},
            {
              get: (_, prop2: string) => {
                const hookType = prop1 as keyof HookHandlersMap<TBot>

                const selfHooks = this._hookHandlers[hookType] ?? {}
                const selfSpecificHandlers = selfHooks[prop2] ?? []
                const selfGlobalHandlers = selfHooks['*'] ?? []
                const selfHandlers = [...selfSpecificHandlers, ...selfGlobalHandlers]

                const pluginHandlers = Object.values(this._plugins).flatMap(
                  (plugin) => (plugin.hookHandlers[hookType]?.[prop2] ?? []) as typeof selfHandlers
                )

                return utils.arrays.unique([...selfHandlers, ...pluginHandlers])
              },
            }
          )
        },
      }
    ) as HookHandlersMap<TBot>
  }

  public readonly on = {
    message: <T extends keyof MessageHandlersMap<TBot>>(type: T, handler: MessageHandlers<TBot>[T]): void => {
      this._messageHandlers[type as string] = utils.arrays.safePush(
        this._messageHandlers[type as string],
        handler as MessageHandlers<any>[string]
      )
    },
    event: <T extends keyof EventHandlersMap<TBot>>(type: T, handler: EventHandlers<TBot>[T]): void => {
      this._eventHandlers[type as string] = utils.arrays.safePush(
        this._eventHandlers[type as string],
        handler as EventHandlers<any>[string]
      )
    },
    stateExpired: <T extends keyof StateExpiredHandlersMap<TBot>>(
      type: T,
      handler: StateExpiredHandlers<TBot>[T]
    ): void => {
      this._stateExpiredHandlers[type as string] = utils.arrays.safePush(
        this._stateExpiredHandlers[type as string],
        handler as StateExpiredHandlers<any>[string]
      )
    },
    beforeIncomingEvent: <T extends keyof HookData<TBot>['before_incoming_event']>(
      type: T,
      handler: HookHandlers<TBot>['before_incoming_event'][T]
    ) => {
      this._hookHandlers.before_incoming_event[type as string] = utils.arrays.safePush(
        this._hookHandlers.before_incoming_event[type as string],
        handler as HookHandlers<any>['before_incoming_event'][string]
      )
    },
    beforeIncomingMessage: <T extends keyof HookData<TBot>['before_incoming_message']>(
      type: T,
      handler: HookHandlers<TBot>['before_incoming_message'][T]
    ) => {
      this._hookHandlers.before_incoming_message[type as string] = utils.arrays.safePush(
        this._hookHandlers.before_incoming_message[type as string],
        handler as HookHandlers<any>['before_incoming_message'][string]
      )
    },
    beforeOutgoingMessage: <T extends keyof HookData<TBot>['before_outgoing_message']>(
      type: T,
      handler: HookHandlers<TBot>['before_outgoing_message'][T]
    ) => {
      this._hookHandlers.before_outgoing_message[type as string] = utils.arrays.safePush(
        this._hookHandlers.before_outgoing_message[type as string],
        handler as HookHandlers<any>['before_outgoing_message'][string]
      )
    },
    beforeOutgoingCallAction: <T extends keyof HookData<TBot>['before_outgoing_call_action']>(
      type: T,
      handler: HookHandlers<TBot>['before_outgoing_call_action'][T]
    ) => {
      this._hookHandlers.before_outgoing_call_action[type as string] = utils.arrays.safePush(
        this._hookHandlers.before_outgoing_call_action[type as string],
        handler as HookHandlers<any>['before_outgoing_call_action'][string]
      )
    },
    afterIncomingEvent: <T extends keyof HookData<TBot>['after_incoming_event']>(
      type: T,
      handler: HookHandlers<TBot>['after_incoming_event'][T]
    ) => {
      this._hookHandlers.after_incoming_event[type as string] = utils.arrays.safePush(
        this._hookHandlers.after_incoming_event[type as string],
        handler as HookHandlers<any>['after_incoming_event'][string]
      )
    },
    afterIncomingMessage: <T extends keyof HookData<TBot>['after_incoming_message']>(
      type: T,
      handler: HookHandlers<TBot>['after_incoming_message'][T]
    ) => {
      this._hookHandlers.after_incoming_message[type as string] = utils.arrays.safePush(
        this._hookHandlers.after_incoming_message[type as string],
        handler as HookHandlers<any>['after_incoming_message'][string]
      )
    },
    afterOutgoingMessage: <T extends keyof HookData<TBot>['after_outgoing_message']>(
      type: T,
      handler: HookHandlers<TBot>['after_outgoing_message'][T]
    ) => {
      this._hookHandlers.after_outgoing_message[type as string] = utils.arrays.safePush(
        this._hookHandlers.after_outgoing_message[type as string],
        handler as HookHandlers<any>['after_outgoing_message'][string]
      )
    },
    afterOutgoingCallAction: <T extends keyof HookData<TBot>['after_outgoing_call_action']>(
      type: T,
      handler: HookHandlers<TBot>['after_outgoing_call_action'][T]
    ) => {
      this._hookHandlers.after_outgoing_call_action[type as string] = utils.arrays.safePush(
        this._hookHandlers.after_outgoing_call_action[type as string],
        handler as HookHandlers<any>['after_outgoing_call_action'][string]
      )
    },
  }

  public readonly handler = botHandler(this as BotHandlers<any>)

  public readonly start = (port?: number): Promise<Server> => serve(this.handler, port)
}

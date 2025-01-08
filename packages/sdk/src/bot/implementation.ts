import type { Server } from 'node:http'
import { BasePlugin, PluginImplementation } from '../plugin'
import { serve } from '../serve'
import * as utils from '../utils'
import { mergeBots } from './merge-bots'
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

  public constructor(public readonly props: BotImplementationProps<TBot, TPlugins>) {
    this._actionHandlers = props.actions as ActionHandlers<TBot>
    const plugins = utils.records.values(props.plugins)
    for (const plugin of plugins) {
      this._use(plugin as BotHandlers<any>)
    }
  }

  public get actionHandlers(): ActionHandlers<TBot> {
    return this._actionHandlers as ActionHandlers<TBot>
  }

  public get messageHandlers(): MessageHandlersMap<TBot> {
    return new Proxy(
      {},
      {
        /** returns both the message handlers for the target type but global as well */
        get: (_, prop) => {
          const specificHandlers = this._messageHandlers[prop as keyof MessageHandlersMap<TBot>] ?? []
          const globalHandlers = this._messageHandlers['*'] ?? []
          return [...specificHandlers, ...globalHandlers]
        },
      }
    ) as MessageHandlersMap<TBot>
  }

  public get eventHandlers(): EventHandlersMap<TBot> {
    return new Proxy(
      {},
      {
        /** returns both the event handlers for the target type but global as well */
        get: (_, prop) => {
          const specificHandlers = this._eventHandlers[prop as keyof EventHandlersMap<TBot>] ?? []
          const globalHandlers = this._eventHandlers['*'] ?? []
          return [...specificHandlers, ...globalHandlers]
        },
      }
    ) as EventHandlersMap<TBot>
  }

  public get stateExpiredHandlers(): StateExpiredHandlersMap<TBot> {
    return new Proxy(
      {},
      {
        /** returns both the state expired handlers for the target type but global as well */
        get: (_, prop) => {
          const specificHandlers = this._stateExpiredHandlers[prop as keyof StateExpiredHandlersMap<TBot>] ?? []
          const globalHandlers = this._stateExpiredHandlers['*'] ?? []
          return [...specificHandlers, ...globalHandlers]
        },
      }
    ) as StateExpiredHandlersMap<TBot>
  }

  public get hookHandlers(): HookHandlersMap<TBot> {
    return new Proxy(
      {},
      {
        get: (_, prop1) =>
          new Proxy(
            {},
            {
              get: (_, prop2) => {
                const hooks = this._hookHandlers[prop1 as keyof HookHandlersMap<TBot>] ?? {}
                const specificHandlers = hooks[prop2 as keyof HookData<TBot>] ?? []
                const globalHandlers = hooks['*'] ?? []
                return [...specificHandlers, ...globalHandlers]
              },
            }
          ),
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

  private readonly _use = (botLike: BotHandlers<any>): void => {
    mergeBots(this as BotHandlers<any>, botLike)
  }

  public readonly handler = botHandler(this as BotHandlers<any>)

  public readonly start = (port?: number): Promise<Server> => serve(this.handler, port)
}

import { Client } from '@botpress/client'
import {
  MessageHandlersMap as BotMessageHandlersMap,
  EventHandlersMap as BotEventHandlersMap,
  StateExpiredHandlersMap as BotStateExpiredHandlersMap,
  HookHandlersMap as BotHookHandlersMap,
  ActionHandlers as BotActionHandlers,
  BotHandlers,
} from '../bot'
import * as utils from '../utils'
import { ActionProxy, proxy } from './action-proxy'
import {
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
  MessagePayloads,
  PluginConfiguration,
  StateExpiredPayloads,
} from './server/types'
import { BasePlugin, PluginInterfaceExtensions } from './types'

export type PluginImplementationProps<TPlugin extends BasePlugin = BasePlugin> = {
  actions: ActionHandlers<TPlugin>
}

export type PluginRuntimeProps<TPlugin extends BasePlugin = BasePlugin> = {
  configuration: PluginConfiguration<TPlugin>
  interfaces: PluginInterfaceExtensions<TPlugin>
}

type Tools<TPlugin extends BasePlugin = BasePlugin> = {
  configuration: PluginConfiguration<TPlugin>
  interfaces: PluginInterfaceExtensions<TPlugin>
  actions: ActionProxy<TPlugin>
}

export class PluginImplementation<TPlugin extends BasePlugin = BasePlugin> implements BotHandlers<TPlugin> {
  private _runtimeProps: PluginRuntimeProps<TPlugin> | undefined

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

  public constructor(public readonly props: PluginImplementationProps<TPlugin>) {
    this._actionHandlers = props.actions
  }

  public initialize(config: PluginRuntimeProps<TPlugin>): this {
    this._runtimeProps = config
    return this
  }

  private get _tools(): Tools {
    if (!this._runtimeProps) {
      throw new Error(
        'Plugin not correctly initialized. This is likely because you access your plugin config outside of an handler.'
      )
    }
    const { configuration, interfaces } = this._runtimeProps
    const client = new Client()
    const actions = proxy(client, interfaces) as ActionProxy<BasePlugin>
    return {
      configuration,
      interfaces,
      actions,
    }
  }

  public get actionHandlers(): BotActionHandlers<TPlugin> {
    const pluginHandlers = this._actionHandlers
    const botHandlers: BotActionHandlers<any> = {}
    for (const [name, handler] of utils.records.pairs(pluginHandlers)) {
      botHandlers[name] = async (input) => {
        return handler({ ...input, ...this._tools })
      }
    }
    return botHandlers
  }

  public get messageHandlers(): BotMessageHandlersMap<TPlugin> {
    return new Proxy(
      {},
      {
        get: (_, prop) => {
          const specificHandlers = this._messageHandlers[prop as string] ?? []
          const globalHandlers = this._messageHandlers['*'] ?? []
          const allHandlers = [...specificHandlers, ...globalHandlers]
          return allHandlers.map(
            (handler) => (input: MessagePayloads<any>[string]) => handler({ ...input, ...this._tools })
          )
        },
      }
    )
  }

  public get eventHandlers(): BotEventHandlersMap<TPlugin> {
    return new Proxy(
      {},
      {
        get: (_, prop) => {
          const specificHandlers = this._eventHandlers[prop as string] ?? []
          const globalHandlers = this._eventHandlers['*'] ?? []
          // TODO: happend relevant interfaces handlers
          const allHandlers = [...specificHandlers, ...globalHandlers]
          return allHandlers.map(
            (handler) => (input: MessagePayloads<any>[string]) => handler({ ...input, ...this._tools })
          )
        },
      }
    )
  }

  public get stateExpiredHandlers(): BotStateExpiredHandlersMap<TPlugin> {
    return new Proxy(
      {},
      {
        get: (_, prop) => {
          const specificHandlers = this._stateExpiredHandlers[prop as string] ?? []
          const globalHandlers = this._stateExpiredHandlers['*'] ?? []
          const allHandlers = [...specificHandlers, ...globalHandlers]
          return allHandlers.map(
            (handler) => (input: StateExpiredPayloads<any>[string]) => handler({ ...input, ...this._tools })
          )
        },
      }
    )
  }

  public get hookHandlers(): BotHookHandlersMap<TPlugin> {
    return new Proxy(
      {},
      {
        get: (_, prop1: string) => {
          const hooks = this._hookHandlers[prop1 as keyof HookHandlersMap<TPlugin>]
          if (!hooks) {
            return undefined
          }
          return new Proxy(
            {},
            {
              get: (_, prop2) => {
                const handlers = hooks[prop2 as string] ?? []
                return handlers.map((handler) => (input: any) => handler({ ...input, ...this._tools }))
              },
            }
          )
        },
      }
    ) as BotHookHandlersMap<TPlugin>
  }

  public readonly on = {
    message: <T extends keyof MessageHandlersMap<TPlugin>>(type: T, handler: MessageHandlers<TPlugin>[T]): void => {
      this._messageHandlers[type as string] = utils.arrays.safePush(
        this._messageHandlers[type as string],
        handler as MessageHandlers<BasePlugin>[string]
      )
    },
    event: <T extends keyof EventHandlersMap<TPlugin>>(type: T, handler: EventHandlers<TPlugin>[T]): void => {
      this._eventHandlers[type as string] = utils.arrays.safePush(
        this._eventHandlers[type as string],
        handler as EventHandlers<BasePlugin>[string]
      )
    },
    stateExpired: <T extends keyof StateExpiredHandlersMap<TPlugin>>(
      type: T,
      handler: StateExpiredHandlers<TPlugin>[T]
    ): void => {
      this._stateExpiredHandlers[type as string] = utils.arrays.safePush(
        this._stateExpiredHandlers[type as string],
        handler as StateExpiredHandlers<BasePlugin>[string]
      )
    },
    beforeIncomingEvent: <T extends keyof HookData<TPlugin>['before_incoming_event']>(
      type: T,
      handler: HookHandlers<TPlugin>['before_incoming_event'][T]
    ) => {
      this._hookHandlers.before_incoming_event[type as string] = utils.arrays.safePush(
        this._hookHandlers.before_incoming_event[type as string],
        handler as HookHandlers<BasePlugin>['before_incoming_event'][string]
      )
    },
    beforeIncomingMessage: <T extends keyof HookData<TPlugin>['before_incoming_message']>(
      type: T,
      handler: HookHandlers<TPlugin>['before_incoming_message'][T]
    ) => {
      this._hookHandlers.before_incoming_message[type as string] = utils.arrays.safePush(
        this._hookHandlers.before_incoming_message[type as string],
        handler as HookHandlers<BasePlugin>['before_incoming_message'][string]
      )
    },
    beforeOutgoingMessage: <T extends keyof HookData<TPlugin>['before_outgoing_message']>(
      type: T,
      handler: HookHandlers<TPlugin>['before_outgoing_message'][T]
    ) => {
      this._hookHandlers.before_outgoing_message[type as string] = utils.arrays.safePush(
        this._hookHandlers.before_outgoing_message[type as string],
        handler as HookHandlers<BasePlugin>['before_outgoing_message'][string]
      )
    },
    beforeOutgoingCallAction: <T extends keyof HookData<TPlugin>['before_outgoing_call_action']>(
      type: T,
      handler: HookHandlers<TPlugin>['before_outgoing_call_action'][T]
    ) => {
      this._hookHandlers.before_outgoing_call_action[type as string] = utils.arrays.safePush(
        this._hookHandlers.before_outgoing_call_action[type as string],
        handler as HookHandlers<BasePlugin>['before_outgoing_call_action'][string]
      )
    },
    afterIncomingEvent: <T extends keyof HookData<TPlugin>['after_incoming_event']>(
      type: T,
      handler: HookHandlers<TPlugin>['after_incoming_event'][T]
    ) => {
      this._hookHandlers.after_incoming_event[type as string] = utils.arrays.safePush(
        this._hookHandlers.after_incoming_event[type as string],
        handler as HookHandlers<BasePlugin>['after_incoming_event'][string]
      )
    },
    afterIncomingMessage: <T extends keyof HookData<TPlugin>['after_incoming_message']>(
      type: T,
      handler: HookHandlers<TPlugin>['after_incoming_message'][T]
    ) => {
      this._hookHandlers.after_incoming_message[type as string] = utils.arrays.safePush(
        this._hookHandlers.after_incoming_message[type as string],
        handler as HookHandlers<BasePlugin>['after_incoming_message'][string]
      )
    },
    afterOutgoingMessage: <T extends keyof HookData<TPlugin>['after_outgoing_message']>(
      type: T,
      handler: HookHandlers<TPlugin>['after_outgoing_message'][T]
    ) => {
      this._hookHandlers.after_outgoing_message[type as string] = utils.arrays.safePush(
        this._hookHandlers.after_outgoing_message[type as string],
        handler as HookHandlers<BasePlugin>['after_outgoing_message'][string]
      )
    },
    afterOutgoingCallAction: <T extends keyof HookData<TPlugin>['after_outgoing_call_action']>(
      type: T,
      handler: HookHandlers<TPlugin>['after_outgoing_call_action'][T]
    ) => {
      this._hookHandlers.after_outgoing_call_action[type as string] = utils.arrays.safePush(
        this._hookHandlers.after_outgoing_call_action[type as string],
        handler as HookHandlers<BasePlugin>['after_outgoing_call_action'][string]
      )
    },
  }
}

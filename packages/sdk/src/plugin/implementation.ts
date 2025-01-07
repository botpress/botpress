import {
  MessageHandlersMap as BotMessageHandlersMap,
  EventHandlersMap as BotEventHandlersMap,
  StateExpiredHandlersMap as BotStateExpiredHandlersMap,
  HookHandlersMap as BotHookHandlersMap,
  ActionHandlers as BotActionHandlers,
  BotHandlers,
} from '../bot'
import * as utils from '../utils'
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
} from './server/types'
import { BasePlugin, PluginInterfaceExtension } from './types'

export type PluginImplementationProps<TPlugin extends BasePlugin = BasePlugin> = {
  actions: ActionHandlers<TPlugin>
}

export type PluginRuntimeProps<TPlugin extends BasePlugin = BasePlugin> = {
  configuration: TPlugin['configuration']
  interfaces: {
    [K in keyof TPlugin['interfaces']]: PluginInterfaceExtension<TPlugin['interfaces'][K]>
  }
}

export class PluginImplementation<TPlugin extends BasePlugin = BasePlugin> implements BotHandlers<TPlugin> {
  private _runtimeProps: PluginRuntimeProps<TPlugin> | undefined

  private _actionHandlers: ActionHandlers<TPlugin>
  private _messageHandlers: MessageHandlersMap<TPlugin> = {}
  private _eventHandlers: EventHandlersMap<TPlugin> = {}
  private _stateExpiredHandlers: StateExpiredHandlersMap<TPlugin> = {}
  private _hookHandlers: HookHandlersMap<TPlugin> = {
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

  private get _tools(): PluginRuntimeProps<TPlugin> {
    if (!this._runtimeProps) {
      throw new Error(
        'Plugin not correctly initialized. This is likely because you access your plugin config outside of an handler.'
      )
    }
    return this._runtimeProps
  }

  public get actionHandlers(): BotActionHandlers<TPlugin> {
    const pluginHandlers = this._actionHandlers as ActionHandlers<BasePlugin>
    const botHandlers: BotActionHandlers<BasePlugin> = {}
    for (const [name, handler] of utils.records.pairs(pluginHandlers)) {
      botHandlers[name] = async (input) => {
        return handler({ ...input, ...this._tools })
      }
    }
    return botHandlers as any
  }

  public get messageHandlers(): BotMessageHandlersMap<TPlugin> {
    const pluginHandlers = this._messageHandlers as MessageHandlersMap<BasePlugin>
    const botHandlers: BotMessageHandlersMap<BasePlugin> = {}
    for (const [name, handlers] of utils.records.pairs(pluginHandlers)) {
      botHandlers[name] = handlers?.map((handler) => async (input) => {
        return handler({ ...input, ...this._tools })
      })
    }
    return botHandlers as any
  }

  public get eventHandlers(): BotEventHandlersMap<TPlugin> {
    const pluginHandlers = this._eventHandlers as EventHandlersMap<BasePlugin>
    const botHandlers: BotEventHandlersMap<BasePlugin> = {}
    for (const [name, handlers] of utils.records.pairs(pluginHandlers)) {
      botHandlers[name] = handlers?.map((handler) => async (input) => {
        return handler({ ...input, ...this._tools })
      })
    }
    return botHandlers as any
  }

  public get stateExpiredHandlers(): BotStateExpiredHandlersMap<TPlugin> {
    const pluginHandlers = this._stateExpiredHandlers as StateExpiredHandlersMap<BasePlugin>
    const botHandlers: BotStateExpiredHandlersMap<BasePlugin> = {}
    for (const [name, handlers] of utils.records.pairs(pluginHandlers)) {
      botHandlers[name] = handlers?.map((handler) => async (input) => {
        return handler({ ...input, ...this._tools })
      })
    }
    return botHandlers as any
  }

  public get hookHandlers(): BotHookHandlersMap<TPlugin> {
    const pluginHandlers = this._hookHandlers as HookHandlersMap<BasePlugin>
    const botHandlers: BotHookHandlersMap<BasePlugin> = {
      before_incoming_event: {},
      before_incoming_message: {},
      before_outgoing_message: {},
      before_outgoing_call_action: {},
      after_incoming_event: {},
      after_incoming_message: {},
      after_outgoing_message: {},
      after_outgoing_call_action: {},
    }

    for (const [name, handlers] of utils.records.pairs(pluginHandlers.before_incoming_event)) {
      botHandlers.before_incoming_event[name] = handlers?.map((handler) => {
        return async (input) => {
          return handler({ ...input, ...this._tools })
        }
      })
    }
    for (const [name, handlers] of utils.records.pairs(pluginHandlers.before_incoming_message)) {
      botHandlers.before_incoming_message[name] = handlers?.map((handler) => async (input) => {
        return handler({ ...input, ...this._tools })
      })
    }
    for (const [name, handlers] of utils.records.pairs(pluginHandlers.before_outgoing_message)) {
      botHandlers.before_outgoing_message[name] = handlers?.map((handler) => async (input) => {
        return handler({ ...input, ...this._tools })
      })
    }
    for (const [name, handlers] of utils.records.pairs(pluginHandlers.before_outgoing_call_action)) {
      botHandlers.before_outgoing_call_action[name] = handlers?.map((handler) => async (input) => {
        return handler({ ...input, ...this._tools })
      })
    }
    for (const [name, handlers] of utils.records.pairs(pluginHandlers.after_incoming_event)) {
      botHandlers.after_incoming_event[name] = handlers?.map((handler) => async (input) => {
        return handler({ ...input, ...this._tools })
      })
    }
    for (const [name, handlers] of utils.records.pairs(pluginHandlers.after_incoming_message)) {
      botHandlers.after_incoming_message[name] = handlers?.map((handler) => async (input) => {
        return handler({ ...input, ...this._tools })
      })
    }
    for (const [name, handlers] of utils.records.pairs(pluginHandlers.after_outgoing_message)) {
      botHandlers.after_outgoing_message[name] = handlers?.map((handler) => async (input) => {
        return handler({ ...input, ...this._tools })
      })
    }
    for (const [name, handlers] of utils.records.pairs(pluginHandlers.after_outgoing_call_action)) {
      botHandlers.after_outgoing_call_action[name] = handlers?.map((handler) => async (input) => {
        return handler({ ...input, ...this._tools })
      })
    }

    return botHandlers as any
  }

  public readonly on = {
    message: <T extends keyof MessageHandlersMap<TPlugin>>(type: T, handler: MessageHandlers<TPlugin>[T]): void => {
      this._messageHandlers[type] = utils.arrays.safePush(this._messageHandlers[type], handler)
    },
    event: <T extends keyof EventHandlersMap<TPlugin>>(type: T, handler: EventHandlers<TPlugin>[T]): void => {
      this._eventHandlers[type] = utils.arrays.safePush(this._eventHandlers[type], handler)
    },
    stateExpired: <T extends keyof StateExpiredHandlersMap<TPlugin>>(
      type: T,
      handler: StateExpiredHandlers<TPlugin>[T]
    ): void => {
      this._stateExpiredHandlers[type] = utils.arrays.safePush(this._stateExpiredHandlers[type], handler)
    },
    beforeIncomingEvent: <T extends keyof HookData<TPlugin>['before_incoming_event']>(
      type: T,
      handler: HookHandlers<TPlugin>['before_incoming_event'][T]
    ) => {
      this._hookHandlers.before_incoming_event[type] = utils.arrays.safePush(
        this._hookHandlers.before_incoming_event[type],
        handler
      )
    },
    beforeIncomingMessage: <T extends keyof HookData<TPlugin>['before_incoming_message']>(
      type: T,
      handler: HookHandlers<TPlugin>['before_incoming_message'][T]
    ) => {
      this._hookHandlers.before_incoming_message[type] = utils.arrays.safePush(
        this._hookHandlers.before_incoming_message[type],
        handler
      )
    },
    beforeOutgoingMessage: <T extends keyof HookData<TPlugin>['before_outgoing_message']>(
      type: T,
      handler: HookHandlers<TPlugin>['before_outgoing_message'][T]
    ) => {
      this._hookHandlers.before_outgoing_message[type] = utils.arrays.safePush(
        this._hookHandlers.before_outgoing_message[type],
        handler
      )
    },
    beforeOutgoingCallAction: <T extends keyof HookData<TPlugin>['before_outgoing_call_action']>(
      type: T,
      handler: HookHandlers<TPlugin>['before_outgoing_call_action'][T]
    ) => {
      this._hookHandlers.before_outgoing_call_action[type] = utils.arrays.safePush(
        this._hookHandlers.before_outgoing_call_action[type],
        handler
      )
    },
    afterIncomingEvent: <T extends keyof HookData<TPlugin>['after_incoming_event']>(
      type: T,
      handler: HookHandlers<TPlugin>['after_incoming_event'][T]
    ) => {
      this._hookHandlers.after_incoming_event[type] = utils.arrays.safePush(
        this._hookHandlers.after_incoming_event[type],
        handler
      )
    },
    afterIncomingMessage: <T extends keyof HookData<TPlugin>['after_incoming_message']>(
      type: T,
      handler: HookHandlers<TPlugin>['after_incoming_message'][T]
    ) => {
      this._hookHandlers.after_incoming_message[type] = utils.arrays.safePush(
        this._hookHandlers.after_incoming_message[type],
        handler
      )
    },
    afterOutgoingMessage: <T extends keyof HookData<TPlugin>['after_outgoing_message']>(
      type: T,
      handler: HookHandlers<TPlugin>['after_outgoing_message'][T]
    ) => {
      this._hookHandlers.after_outgoing_message[type] = utils.arrays.safePush(
        this._hookHandlers.after_outgoing_message[type],
        handler
      )
    },
    afterOutgoingCallAction: <T extends keyof HookData<TPlugin>['after_outgoing_call_action']>(
      type: T,
      handler: HookHandlers<TPlugin>['after_outgoing_call_action'][T]
    ) => {
      this._hookHandlers.after_outgoing_call_action[type] = utils.arrays.safePush(
        this._hookHandlers.after_outgoing_call_action[type],
        handler
      )
    },
  }
}

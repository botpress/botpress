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
  HookDefinitions,
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
  public readonly actionHandlers: ActionHandlers<TBot>
  public readonly messageHandlers: MessageHandlersMap<TBot> = {}
  public readonly eventHandlers: EventHandlersMap<TBot> = {}
  public readonly stateExpiredHandlers: StateExpiredHandlersMap<TBot> = {}
  public readonly hookHandlers: HookHandlersMap<TBot> = {
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
    this.actionHandlers = props.actions as ActionHandlers<TBot>
    for (const plugin of Object.values(props.plugins)) {
      this._use(plugin)
    }
  }

  public readonly message = <T extends keyof MessageHandlersMap<TBot>>(
    type: T,
    handler: MessageHandlers<TBot>[T]
  ): void => {
    this.messageHandlers[type] = utils.arrays.safePush(this.messageHandlers[type], handler)
  }

  public readonly event = <T extends keyof EventHandlersMap<TBot>>(type: T, handler: EventHandlers<TBot>[T]): void => {
    this.eventHandlers[type] = utils.arrays.safePush(this.eventHandlers[type], handler)
  }

  public readonly stateExpired = <T extends keyof StateExpiredHandlersMap<TBot>>(
    type: T,
    handler: StateExpiredHandlers<TBot>[T]
  ): void => {
    this.stateExpiredHandlers[type] = utils.arrays.safePush(this.stateExpiredHandlers[type], handler)
  }

  public readonly hook = {
    beforeIncomingEvent: <T extends keyof HookDefinitions<TBot>['before_incoming_event']>(
      type: T,
      handler: HookHandlers<TBot>['before_incoming_event'][T]
    ) => {
      this.hookHandlers.before_incoming_event[type] = utils.arrays.safePush(
        this.hookHandlers.before_incoming_event[type],
        handler
      )
    },
    beforeIncomingMessage: <T extends keyof HookDefinitions<TBot>['before_incoming_message']>(
      type: T,
      handler: HookHandlers<TBot>['before_incoming_message'][T]
    ) => {
      this.hookHandlers.before_incoming_message[type] = utils.arrays.safePush(
        this.hookHandlers.before_incoming_message[type],
        handler
      )
    },
    beforeOutgoingMessage: <T extends keyof HookDefinitions<TBot>['before_outgoing_message']>(
      type: T,
      handler: HookHandlers<TBot>['before_outgoing_message'][T]
    ) => {
      this.hookHandlers.before_outgoing_message[type] = utils.arrays.safePush(
        this.hookHandlers.before_outgoing_message[type],
        handler
      )
    },
    beforeOutgoingCallAction: <T extends keyof HookDefinitions<TBot>['before_outgoing_call_action']>(
      type: T,
      handler: HookHandlers<TBot>['before_outgoing_call_action'][T]
    ) => {
      this.hookHandlers.before_outgoing_call_action[type] = utils.arrays.safePush(
        this.hookHandlers.before_outgoing_call_action[type],
        handler
      )
    },
    afterIncomingEvent: <T extends keyof HookDefinitions<TBot>['after_incoming_event']>(
      type: T,
      handler: HookHandlers<TBot>['after_incoming_event'][T]
    ) => {
      this.hookHandlers.after_incoming_event[type] = utils.arrays.safePush(
        this.hookHandlers.after_incoming_event[type],
        handler
      )
    },
    afterIncomingMessage: <T extends keyof HookDefinitions<TBot>['after_incoming_message']>(
      type: T,
      handler: HookHandlers<TBot>['after_incoming_message'][T]
    ) => {
      this.hookHandlers.after_incoming_message[type] = utils.arrays.safePush(
        this.hookHandlers.after_incoming_message[type],
        handler
      )
    },
    afterOutgoingMessage: <T extends keyof HookDefinitions<TBot>['after_outgoing_message']>(
      type: T,
      handler: HookHandlers<TBot>['after_outgoing_message'][T]
    ) => {
      this.hookHandlers.after_outgoing_message[type] = utils.arrays.safePush(
        this.hookHandlers.after_outgoing_message[type],
        handler
      )
    },
    afterOutgoingCallAction: <T extends keyof HookDefinitions<TBot>['after_outgoing_call_action']>(
      type: T,
      handler: HookHandlers<TBot>['after_outgoing_call_action'][T]
    ) => {
      this.hookHandlers.after_outgoing_call_action[type] = utils.arrays.safePush(
        this.hookHandlers.after_outgoing_call_action[type],
        handler
      )
    },
  }

  private readonly _use = (botLike: BotHandlers<any>): void => {
    type AnyActionHandler = utils.types.ValueOf<ActionHandlers<BaseBot>>
    type AnyEventHandler = utils.types.ValueOf<EventHandlers<BaseBot>>
    type AnyMessageHandler = utils.types.ValueOf<MessageHandlers<BaseBot>>
    type AnyStateExpiredHandler = utils.types.ValueOf<StateExpiredHandlers<BaseBot>>
    type AnyHookHandler = utils.types.ValueOf<utils.types.ValueOf<HookHandlers<BaseBot>>>

    type AnyActionHandlers = Record<string, AnyActionHandler>
    type AnyEventHandlers = Record<string, AnyEventHandler[] | undefined>
    type AnyMessageHandlers = Record<string, AnyMessageHandler[] | undefined>
    type AnyStateExpiredHandlers = Record<string, AnyStateExpiredHandler[] | undefined>
    type AnyHookHandlers = Record<string, Record<string, AnyHookHandler[] | undefined>>

    const thisActionHandlers = this.actionHandlers as unknown as AnyActionHandlers // TODO: rm this unknown cast
    const thisEventHandlers = this.eventHandlers as AnyEventHandlers
    const thisMessageHandlers = this.messageHandlers as AnyMessageHandlers
    const thisStateExpiredHandlers = this.stateExpiredHandlers as AnyStateExpiredHandlers
    const thisHookHandlers = this.hookHandlers as AnyHookHandlers

    const thatActionHandlers = botLike.actionHandlers as AnyActionHandlers
    const thatEventHandlers = botLike.eventHandlers as AnyEventHandlers
    const thatMessageHandlers = botLike.messageHandlers as AnyMessageHandlers
    const thatStateExpiredHandlers = botLike.stateExpiredHandlers as AnyStateExpiredHandlers
    const thatHookHandlers = botLike.hookHandlers as AnyHookHandlers

    for (const [type, actionHandler] of Object.entries(thatActionHandlers)) {
      thisActionHandlers[type] = actionHandler
    }

    for (const [type, handlers] of Object.entries(thatEventHandlers)) {
      if (!handlers) {
        continue
      }
      thisEventHandlers[type] = utils.arrays.safePush(thisEventHandlers[type], ...handlers)
    }

    for (const [type, handlers] of Object.entries(thatMessageHandlers)) {
      if (!handlers) {
        continue
      }
      thisMessageHandlers[type] = utils.arrays.safePush(thisMessageHandlers[type], ...handlers)
    }

    for (const [type, handlers] of Object.entries(thatStateExpiredHandlers)) {
      if (!handlers) {
        continue
      }
      thisStateExpiredHandlers[type] = utils.arrays.safePush(thisStateExpiredHandlers[type], ...handlers)
    }

    for (const [hook, types] of Object.entries(thatHookHandlers)) {
      for (const [type, handlers] of Object.entries(types)) {
        if (!handlers) {
          continue
        }
        thisHookHandlers[hook]![type] = utils.arrays.safePush(thisHookHandlers[hook]![type], ...handlers)
      }
    }
  }

  public readonly handler = botHandler(this as BotHandlers<any>)

  public readonly start = (port?: number): Promise<Server> => serve(this.handler, port)
}

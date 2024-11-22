import {
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
} from '../bot/server'
import * as utils from '../utils'
import { BasePlugin } from './generic'

export type PluginImplementationProps<TPlugin extends BasePlugin = BasePlugin> = {
  actions: ActionHandlers<TPlugin>
}

export class PluginImplementation<TPlugin extends BasePlugin = BasePlugin> implements BotHandlers<TPlugin> {
  public readonly actionHandlers: ActionHandlers<TPlugin>
  public readonly messageHandlers: MessageHandlersMap<TPlugin> = {}
  public readonly eventHandlers: EventHandlersMap<TPlugin> = {}
  public readonly stateExpiredHandlers: StateExpiredHandlersMap<TPlugin> = {}
  public readonly hookHandlers: HookHandlersMap<TPlugin> = {
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
    this.actionHandlers = props.actions
  }

  public readonly message = <T extends keyof MessageHandlersMap<TPlugin>>(
    type: T,
    handler: MessageHandlers<TPlugin>[T]
  ): void => {
    this.messageHandlers[type] = utils.arrays.safePush(this.messageHandlers[type], handler)
  }

  public readonly event = <T extends keyof EventHandlersMap<TPlugin>>(
    type: T,
    handler: EventHandlers<TPlugin>[T]
  ): void => {
    this.eventHandlers[type] = utils.arrays.safePush(this.eventHandlers[type], handler)
  }

  public readonly stateExpired = <T extends keyof StateExpiredHandlersMap<TPlugin>>(
    type: T,
    handler: StateExpiredHandlers<TPlugin>[T]
  ): void => {
    this.stateExpiredHandlers[type] = utils.arrays.safePush(this.stateExpiredHandlers[type], handler)
  }

  public readonly hook = {
    beforeIncomingEvent: <T extends keyof HookDefinitions<TPlugin>['before_incoming_event']>(
      type: T,
      handler: HookHandlers<TPlugin>['before_incoming_event'][T]
    ) => {
      this.hookHandlers.before_incoming_event[type] = utils.arrays.safePush(
        this.hookHandlers.before_incoming_event[type],
        handler
      )
    },
    beforeIncomingMessage: <T extends keyof HookDefinitions<TPlugin>['before_incoming_message']>(
      type: T,
      handler: HookHandlers<TPlugin>['before_incoming_message'][T]
    ) => {
      this.hookHandlers.before_incoming_message[type] = utils.arrays.safePush(
        this.hookHandlers.before_incoming_message[type],
        handler
      )
    },
    beforeOutgoingMessage: <T extends keyof HookDefinitions<TPlugin>['before_outgoing_message']>(
      type: T,
      handler: HookHandlers<TPlugin>['before_outgoing_message'][T]
    ) => {
      this.hookHandlers.before_outgoing_message[type] = utils.arrays.safePush(
        this.hookHandlers.before_outgoing_message[type],
        handler
      )
    },
    beforeOutgoingCallAction: <T extends keyof HookDefinitions<TPlugin>['before_outgoing_call_action']>(
      type: T,
      handler: HookHandlers<TPlugin>['before_outgoing_call_action'][T]
    ) => {
      this.hookHandlers.before_outgoing_call_action[type] = utils.arrays.safePush(
        this.hookHandlers.before_outgoing_call_action[type],
        handler
      )
    },
    afterIncomingEvent: <T extends keyof HookDefinitions<TPlugin>['after_incoming_event']>(
      type: T,
      handler: HookHandlers<TPlugin>['after_incoming_event'][T]
    ) => {
      this.hookHandlers.after_incoming_event[type] = utils.arrays.safePush(
        this.hookHandlers.after_incoming_event[type],
        handler
      )
    },
    afterIncomingMessage: <T extends keyof HookDefinitions<TPlugin>['after_incoming_message']>(
      type: T,
      handler: HookHandlers<TPlugin>['after_incoming_message'][T]
    ) => {
      this.hookHandlers.after_incoming_message[type] = utils.arrays.safePush(
        this.hookHandlers.after_incoming_message[type],
        handler
      )
    },
    afterOutgoingMessage: <T extends keyof HookDefinitions<TPlugin>['after_outgoing_message']>(
      type: T,
      handler: HookHandlers<TPlugin>['after_outgoing_message'][T]
    ) => {
      this.hookHandlers.after_outgoing_message[type] = utils.arrays.safePush(
        this.hookHandlers.after_outgoing_message[type],
        handler
      )
    },
    afterOutgoingCallAction: <T extends keyof HookDefinitions<TPlugin>['after_outgoing_call_action']>(
      type: T,
      handler: HookHandlers<TPlugin>['after_outgoing_call_action'][T]
    ) => {
      this.hookHandlers.after_outgoing_call_action[type] = utils.arrays.safePush(
        this.hookHandlers.after_outgoing_call_action[type],
        handler
      )
    },
  }
}

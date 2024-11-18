import type { Server } from 'node:http'
import { serve } from '../serve'
import * as utils from '../utils'
import {
  botHandler,
  MessageHandler,
  EventHandler,
  StateExpiredHandler,
  HookImplementationsMap,
  HookDefinitions,
  HookImplementations,
} from './server'
import { BaseBot } from './types'

export type BotImplementationProps<_TBot extends BaseBot = BaseBot> = {
  // TODO: add actions here
}

export class BotImplementation<TBot extends BaseBot = BaseBot> {
  private _messageHandlers: MessageHandler<TBot>[] = []
  private _eventHandlers: EventHandler<TBot>[] = []
  private _stateExpiredHandlers: StateExpiredHandler<TBot>[] = []
  private _hooks: HookImplementationsMap<TBot> = {
    before_incoming_event: {},
    before_incoming_message: {},
    before_outgoing_message: {},
    before_call_action: {},
    after_incoming_event: {},
    after_incoming_message: {},
    after_outgoing_message: {},
    after_call_action: {},
  }

  public constructor(public readonly props: BotImplementationProps<TBot>) {}

  public readonly message = (handler: MessageHandler<TBot>): void => {
    this._messageHandlers.push(handler)
  }

  public readonly event = (handler: EventHandler<TBot>): void => {
    this._eventHandlers.push(handler)
  }

  public readonly stateExpired = (handler: StateExpiredHandler<TBot>): void => {
    this._stateExpiredHandlers.push(handler)
  }

  public readonly hook = {
    before_incoming_event: <T extends keyof HookDefinitions<TBot>['before_incoming_event']>(
      type: T,
      handler: HookImplementations<TBot>['before_incoming_event'][T]
    ) => {
      this._hooks.before_incoming_event[type] = utils.arrays.safePush(this._hooks.before_incoming_event[type], handler)
    },
    before_incoming_message: <T extends keyof HookDefinitions<TBot>['before_incoming_message']>(
      type: T,
      handler: HookImplementations<TBot>['before_incoming_message'][T]
    ) => {
      this._hooks.before_incoming_message[type] = utils.arrays.safePush(
        this._hooks.before_incoming_message[type],
        handler
      )
    },
    before_outgoing_message: <T extends keyof HookDefinitions<TBot>['before_outgoing_message']>(
      type: T,
      handler: HookImplementations<TBot>['before_outgoing_message'][T]
    ) => {
      this._hooks.before_outgoing_message[type] = utils.arrays.safePush(
        this._hooks.before_outgoing_message[type],
        handler
      )
    },
    before_call_action: <T extends keyof HookDefinitions<TBot>['before_call_action']>(
      type: T,
      handler: HookImplementations<TBot>['before_call_action'][T]
    ) => {
      this._hooks.before_call_action[type] = utils.arrays.safePush(this._hooks.before_call_action[type], handler)
    },
    after_incoming_event: <T extends keyof HookDefinitions<TBot>['after_incoming_event']>(
      type: T,
      handler: HookImplementations<TBot>['after_incoming_event'][T]
    ) => {
      this._hooks.after_incoming_event[type] = utils.arrays.safePush(this._hooks.after_incoming_event[type], handler)
    },
    after_incoming_message: <T extends keyof HookDefinitions<TBot>['after_incoming_message']>(
      type: T,
      handler: HookImplementations<TBot>['after_incoming_message'][T]
    ) => {
      this._hooks.after_incoming_message[type] = utils.arrays.safePush(
        this._hooks.after_incoming_message[type],
        handler
      )
    },
    after_outgoing_message: <T extends keyof HookDefinitions<TBot>['after_outgoing_message']>(
      type: T,
      handler: HookImplementations<TBot>['after_outgoing_message'][T]
    ) => {
      this._hooks.after_outgoing_message[type] = utils.arrays.safePush(
        this._hooks.after_outgoing_message[type],
        handler
      )
    },
    after_call_action: <T extends keyof HookDefinitions<TBot>['after_call_action']>(
      type: T,
      handler: HookImplementations<TBot>['after_call_action'][T]
    ) => {
      this._hooks.after_call_action[type] = utils.arrays.safePush(this._hooks.after_call_action[type], handler)
    },
  }

  public readonly handler = botHandler({
    eventHandlers: this._eventHandlers as EventHandler<any>[],
    messageHandlers: this._messageHandlers as MessageHandler<any>[],
    stateExpiredHandlers: this._stateExpiredHandlers as StateExpiredHandler<any>[],
    hooks: this._hooks as HookImplementationsMap<any>,
  })

  public readonly start = (port?: number): Promise<Server> => serve(this.handler, port)
}

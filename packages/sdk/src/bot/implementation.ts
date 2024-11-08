import type { Server } from 'node:http'
import { serve } from '../serve'
import { botHandler, MessageHandler, EventHandler, StateExpiredHandler } from './server'
import { BaseBot } from './types'

type BotState<TBot extends BaseBot = BaseBot> = {
  messageHandlers: MessageHandler<TBot>[]
  eventHandlers: EventHandler<TBot>[]
  stateExpiredHandlers: StateExpiredHandler<TBot>[]
}

export type BotImplementationProps<_TBot extends BaseBot = BaseBot> = {
  // TODO: add actions here
}

export class BotImplementation<TBot extends BaseBot = BaseBot> {
  private _state: BotState<TBot> = {
    messageHandlers: [],
    eventHandlers: [],
    stateExpiredHandlers: [],
  }

  public constructor(public readonly props: BotImplementationProps<TBot>) {}

  public readonly message = (handler: MessageHandler<TBot>): void => {
    this._state.messageHandlers.push(handler)
  }
  public readonly event = (handler: EventHandler<TBot>): void => {
    this._state.eventHandlers.push(handler)
  }
  public readonly stateExpired = (handler: StateExpiredHandler<TBot>): void => {
    this._state.stateExpiredHandlers.push(handler)
  }

  public readonly handler = botHandler(this._state as any as BotState<BaseBot>)
  public readonly start = (port?: number): Promise<Server> => serve(this.handler, port)
}

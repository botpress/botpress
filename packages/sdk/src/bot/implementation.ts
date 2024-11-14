import type { Server } from 'node:http'
import { serve } from '../serve'
import { botHandler, MessageHandler, EventHandler, StateExpiredHandler } from './server'
import { BaseBot } from './types'

export type BotImplementationProps<_TBot extends BaseBot = BaseBot> = {
  // TODO: add actions here
}

export class BotImplementation<TBot extends BaseBot = BaseBot> {
  private _messageHandlers: MessageHandler<TBot>[] = []
  private _eventHandlers: EventHandler<TBot>[] = []
  private _stateExpiredHandlers: StateExpiredHandler<TBot>[] = []

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

  public readonly handler = botHandler({
    eventHandlers: this._eventHandlers as EventHandler<any>[],
    messageHandlers: this._messageHandlers as MessageHandler<any>[],
    stateExpiredHandlers: this._stateExpiredHandlers as StateExpiredHandler<any>[],
  })
  public readonly start = (port?: number): Promise<Server> => serve(this.handler, port)
}

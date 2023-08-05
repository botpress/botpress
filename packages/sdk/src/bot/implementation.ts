import type { Server } from 'node:http'
import { SchemaDefinition } from '../schema'
import { serve } from '../serve'
import { AnyZodObject } from '../type-utils'
import { IntegrationInstance } from './integration-instance'
import { createBotHandler } from './server'
import type { BotState, EventHandler, MessageHandler, StateExpiredHandler } from './state'

/**
 * Bot type argument for smart intellisense and type inference
 */
type TBot = {
  integrations: string
  states: Record<string, AnyZodObject>
  events: Record<string, AnyZodObject>
}

type TagDefinition = {
  title?: string
  description?: string
}

type StateDefinition<TState extends TBot['states'][string]> = SchemaDefinition<TState> & {
  type: 'conversation' | 'user' | 'bot'
  expiry?: number
}

type RecurringEventDefinition = {
  type: string
  payload: Record<string, any>
  schedule: { cron: string }
}

type EventDefinition<TEvent extends TBot['events'][string]> = SchemaDefinition<TEvent>

type ConfigurationDefinition = SchemaDefinition

type UserDefinition = {
  tags?: Record<string, TagDefinition>
}

type ConversationDefinition = {
  tags?: Record<string, TagDefinition>
}

type MessageDefinition = {
  tags?: Record<string, TagDefinition>
}

export type BotProps<T extends TBot = TBot> = {
  integrations?: {
    [K in T['integrations']]: IntegrationInstance<K>
  }
  user?: UserDefinition
  conversation?: ConversationDefinition
  message?: MessageDefinition
  states?: {
    [K in keyof T['states']]: StateDefinition<T['states'][K]>
  }
  configuration?: ConfigurationDefinition
  events?: {
    [K in keyof T['events']]: EventDefinition<T['events'][K]>
  }
  recurringEvents?: Record<string, RecurringEventDefinition>
}

export class Bot<T extends TBot = TBot> {
  private _state: BotState = {
    registerHandlers: [],
    unregisterHandlers: [],
    messageHandlers: [],
    eventHandlers: [],
    stateExpiredHandlers: [],
  }

  public readonly props: BotProps<T>

  public constructor(props: BotProps<T>) {
    this.props = props
  }

  public message = (handler: MessageHandler): void => {
    this._state.messageHandlers.push(handler)
  }
  public event = (handler: EventHandler): void => {
    this._state.eventHandlers.push(handler)
  }
  public stateExpired = (handler: StateExpiredHandler): void => {
    this._state.stateExpiredHandlers.push(handler)
  }

  public handler = createBotHandler(this._state)
  public start = (port?: number): Promise<Server> => serve(this.handler, port)
}

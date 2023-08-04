import type { Bot as BotType, Event } from '@botpress/client'
import type { Server } from 'node:http'
import { SchemaDefinition } from '../schema'
import { serve } from '../serve'
import { AnyZodObject } from '../type-utils'
import { createBotHandler } from './server'
import type { BotState, EventHandler, MessageHandler, StateExpiredHandler } from './state'

export type RegisterBotPayload = {
  bot: BotType
}

export type UnregisterBotPayload = {
  bot: BotType
}

export type EventReceivedBotPayload = {
  event: Event
}

type BaseIntegrations = string
type BaseStates = Record<string, AnyZodObject>
type BaseEvents = Record<string, AnyZodObject>

export type TagDefinition = {
  title?: string
  description?: string
}

export type StateDefinition<TState extends BaseStates[string]> = SchemaDefinition<TState> & {
  type: 'conversation' | 'user' | 'bot'
  expiry?: number
}

export type IntegrationInstance<Name extends string> = {
  id: string
  enabled?: boolean
  configuration?: Record<string, any>

  name: Name
  version: string
}

export type RecurringEventDefinition = {
  type: string
  payload: Record<string, any>
  schedule: { cron: string }
}

export type EventDefinition<TEvent extends BaseEvents[string]> = SchemaDefinition<TEvent>

export type ConfigurationDefinition = SchemaDefinition

export type UserDefinition = {
  tags?: Record<string, TagDefinition>
}

export type ConversationDefinition = {
  tags?: Record<string, TagDefinition>
}

export type MessageDefinition = {
  tags?: Record<string, TagDefinition>
}

export type BotProps<
  TIntegrations extends BaseIntegrations = BaseIntegrations,
  TStates extends BaseStates = BaseStates,
  TEvents extends BaseEvents = BaseEvents
> = {
  integrations?: {
    [K in TIntegrations]: IntegrationInstance<K>
  }
  user?: UserDefinition
  conversation?: ConversationDefinition
  message?: MessageDefinition
  states?: {
    [K in keyof TStates]: StateDefinition<TStates[K]>
  }
  configuration?: ConfigurationDefinition
  events?: {
    [K in keyof TEvents]: EventDefinition<TEvents[K]>
  }
  recurringEvents?: Record<string, RecurringEventDefinition>
}

export class Bot<
  TIntegrations extends BaseIntegrations = BaseIntegrations,
  TStates extends BaseStates = BaseStates,
  TEvents extends BaseEvents = BaseEvents
> {
  private _state: BotState = {
    registerHandlers: [],
    unregisterHandlers: [],
    messageHandlers: [],
    eventHandlers: [],
    stateExpiredHandlers: [],
  }

  public readonly props: BotProps<TIntegrations, TStates, TEvents>

  public constructor(props: BotProps<TIntegrations, TStates, TEvents>) {
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

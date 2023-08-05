import type { Bot as BotType, Event } from '@botpress/client'
import type { Server } from 'node:http'
import { SchemaDefinition } from '../schema'
import { serve } from '../serve'
import { AnyZodObject } from '../type-utils'
import { IntegrationInstance } from './integration-instance'
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

type TagDefinition = {
  title?: string
  description?: string
}

type StateDefinition<TState extends BaseStates[string]> = SchemaDefinition<TState> & {
  type: 'conversation' | 'user' | 'bot'
  expiry?: number
}

type RecurringEventDefinition = {
  type: string
  payload: Record<string, any>
  schedule: { cron: string }
}

type EventDefinition<TEvent extends BaseEvents[string]> = SchemaDefinition<TEvent>

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

  public readonly message = (handler: MessageHandler): void => {
    this._state.messageHandlers.push(handler)
  }
  public readonly event = (handler: EventHandler): void => {
    this._state.eventHandlers.push(handler)
  }
  public readonly stateExpired = (handler: StateExpiredHandler): void => {
    this._state.stateExpiredHandlers.push(handler)
  }

  public readonly handler = createBotHandler(this._state)
  public readonly start = (port?: number): Promise<Server> => serve(this.handler, port)
}

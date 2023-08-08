import type { Server } from 'node:http'
import { SchemaDefinition } from '../schema'
import { serve } from '../serve'
import { Cast } from '../type-utils'
import { BaseStates, BaseEvents, BaseIntegrations } from './generic'
import { IntegrationInstance } from './integration-instance'
import { botHandler, MessageHandler, EventHandler, StateExpiredHandler } from './server'

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
    [K in keyof TIntegrations]?: IntegrationInstance<Cast<K, string>>
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

type BaseBotFrom<
  TIntegrations extends BaseIntegrations = BaseIntegrations,
  TStates extends BaseStates = BaseStates,
  TEvents extends BaseEvents = BaseEvents
> = {
  integrations: TIntegrations
  states: TStates
  events: TEvents
}

type BotState<
  TIntegrations extends BaseIntegrations = BaseIntegrations,
  TStates extends BaseStates = BaseStates,
  TEvents extends BaseEvents = BaseEvents
> = {
  messageHandlers: MessageHandler<BaseBotFrom<TIntegrations, TStates, TEvents>>[]
  eventHandlers: EventHandler<BaseBotFrom<TIntegrations, TStates, TEvents>>[]
  stateExpiredHandlers: StateExpiredHandler<BaseBotFrom<TIntegrations, TStates, TEvents>>[]
}

export class Bot<
  TIntegrations extends BaseIntegrations = BaseIntegrations,
  TStates extends BaseStates = BaseStates,
  TEvents extends BaseEvents = BaseEvents
> {
  private _state: BotState<TIntegrations, TStates, TEvents> = {
    messageHandlers: [],
    eventHandlers: [],
    stateExpiredHandlers: [],
  }

  public readonly props: BotProps<TIntegrations, TStates, TEvents>

  public constructor(props: BotProps<TIntegrations, TStates, TEvents>) {
    this.props = props
  }

  public readonly message = (handler: MessageHandler<BaseBotFrom<TIntegrations, TStates, TEvents>>): void => {
    this._state.messageHandlers.push(handler)
  }
  public readonly event = (handler: EventHandler<BaseBotFrom<TIntegrations, TStates, TEvents>>): void => {
    this._state.eventHandlers.push(handler)
  }
  public readonly stateExpired = (handler: StateExpiredHandler<BaseBotFrom<TIntegrations, TStates, TEvents>>): void => {
    this._state.stateExpiredHandlers.push(handler)
  }

  public readonly handler = botHandler(this._state)
  public readonly start = (port?: number): Promise<Server> => serve(this.handler, port)
}

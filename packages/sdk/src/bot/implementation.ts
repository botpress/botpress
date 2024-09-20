import { z } from '@bpinternal/zui'
import type { Server } from 'node:http'
import { SchemaDefinition } from '../schema'
import { serve } from '../serve'
import { AnyZodObject } from '../type-utils'
import { BaseIntegrations } from './generic'
import { IntegrationInstance } from './integration-instance'
import { botHandler, MessageHandler, EventHandler, StateExpiredHandler, StateType } from './server'

type BaseStates = Record<string, AnyZodObject>
type BaseEvents = Record<string, AnyZodObject>

type TagDefinition = {
  title?: string
  description?: string
}

type StateDefinition<TState extends BaseStates[string]> = SchemaDefinition<TState> & {
  type: StateType
  expiry?: number
}

type RecurringEventDefinition<TEvents extends BaseEvents> = {
  [K in keyof TEvents]: {
    type: K
    payload: z.infer<TEvents[K]>
    schedule: { cron: string }
  }
}[keyof TEvents]

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
    [K in keyof TIntegrations]?: IntegrationInstance<TIntegrations[K]>
  }
  user?: UserDefinition
  conversation?: ConversationDefinition // TODO: add configuration to generic and infer from there
  message?: MessageDefinition
  states?: {
    [K in keyof TStates]: StateDefinition<TStates[K]>
  }
  configuration?: ConfigurationDefinition
  events?: {
    [K in keyof TEvents]: EventDefinition<TEvents[K]>
  }
  recurringEvents?: Record<string, RecurringEventDefinition<TEvents>>
}

type BotFrom<TIntegrations extends BaseIntegrations, TStates extends BaseStates, TEvents extends BaseEvents> = {
  integrations: TIntegrations
  states: {
    [K in keyof TStates]: z.infer<TStates[K]>
  }
  events: {
    [K in keyof TEvents]: z.infer<TEvents[K]>
  }
}

type BotState<
  TIntegrations extends BaseIntegrations = BaseIntegrations,
  TStates extends BaseStates = BaseStates,
  TEvents extends BaseEvents = BaseEvents
> = {
  messageHandlers: MessageHandler<BotFrom<TIntegrations, TStates, TEvents>>[]
  eventHandlers: EventHandler<BotFrom<TIntegrations, TStates, TEvents>>[]
  stateExpiredHandlers: StateExpiredHandler<BotFrom<TIntegrations, TStates, TEvents>>[]
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

  public readonly message = (handler: MessageHandler<BotFrom<TIntegrations, TStates, TEvents>>): void => {
    this._state.messageHandlers.push(handler)
  }
  public readonly event = (handler: EventHandler<BotFrom<TIntegrations, TStates, TEvents>>): void => {
    this._state.eventHandlers.push(handler)
  }
  public readonly stateExpired = (handler: StateExpiredHandler<BotFrom<TIntegrations, TStates, TEvents>>): void => {
    this._state.stateExpiredHandlers.push(handler)
  }

  public readonly handler = botHandler(this._state)
  public readonly start = (port?: number): Promise<Server> => serve(this.handler, port)
}

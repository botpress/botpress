import type { Bot as BotType, Event } from '@botpress/client'
import type { Server } from 'node:http'
import { mapValues } from 'radash'
import { SchemaDefinition, schemaDefinitionToJsonSchema } from '../schema'
import { serve } from '../serve'
import { Merge } from '../type-utils'
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

export type TagDefinition = {
  title?: string
  description?: string
}

export type StateDefinition = {
  type: 'conversation' | 'user' | 'bot'
  schema: Record<string, any>
  expiry?: number
}

export type IntegrationInstance = {
  id: string
  enabled?: boolean
  configuration?: Record<string, any>
}

export type RecurringEventDefinition = {
  type: string
  payload: Record<string, any>
  schedule: { cron: string }
}

export type EventDefinition = {
  schema: Record<string, any>
}

export type ConfigurationDefinition = {
  schema: Record<string, any>
}

export type UserDefinition = {
  tags?: Record<string, TagDefinition>
}

export type ConversationDefinition = {
  tags?: Record<string, TagDefinition>
}

export type MessageDefinition = {
  tags?: Record<string, TagDefinition>
}

export type BotDefinition = {
  integrations?: IntegrationInstance[]
  user?: UserDefinition
  conversation?: ConversationDefinition
  message?: MessageDefinition
  states?: Record<string, StateDefinition>
  configuration?: ConfigurationDefinition
  events?: Record<string, EventDefinition>
  recurringEvents?: Record<string, RecurringEventDefinition>
}

export type BotProps = {
  integrations?: IntegrationInstance[]
  user?: UserDefinition
  conversation?: ConversationDefinition
  message?: MessageDefinition
  states?: Record<string, Merge<StateDefinition, SchemaDefinition>>
  configuration?: Merge<ConfigurationDefinition, SchemaDefinition>
  events?: Record<string, Merge<EventDefinition, SchemaDefinition>>
  recurringEvents?: Record<string, RecurringEventDefinition>
}

const propsToDefinition = (props: BotProps): BotDefinition => ({
  ...props,
  configuration: props.configuration
    ? {
        ...props.configuration,
        schema: schemaDefinitionToJsonSchema(props.configuration),
      }
    : undefined,
  events: props.events
    ? mapValues(props.events, (event) => ({
        ...event,
        schema: schemaDefinitionToJsonSchema(event),
      }))
    : undefined,
  states: props.states
    ? mapValues(props.states, (state) => ({
        ...state,
        schema: schemaDefinitionToJsonSchema(state),
      }))
    : undefined,
})

export class Bot {
  private _state: BotState = {
    registerHandlers: [],
    unregisterHandlers: [],
    messageHandlers: [],
    eventHandlers: [],
    stateExpiredHandlers: [],
  }

  public readonly definition: BotDefinition

  public constructor(props: BotProps = {}) {
    this.definition = propsToDefinition(props)
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

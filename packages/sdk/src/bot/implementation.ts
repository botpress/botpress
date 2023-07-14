import type { Bot as BotType, Event } from '@botpress/client'
import type { Server } from 'node:http'
import { serve } from '../serve'
import { createBotHandler } from './server'
import type {
  BotState,
  EventHandler,
  MessageHandler,
  RegisterHandler,
  StateExpiredHandler,
  UnregisterHandler,
} from './state'

export type RegisterBotPayload = {
  bot: BotType
}

export type UnregisterBotPayload = {
  bot: BotType
}

export type EventReceivedBotPayload = {
  event: Event
}

export type BotDefinitionTag = {
  title?: string
  description?: string
}

export type BotDefinitionStateType = 'conversation' | 'user' | 'bot'
export type BotDefinitionState = {
  type: BotDefinitionStateType
  schema: Record<string, any>
  expiry?: number
}

export type IntegrationInstance = {
  id: string
  enabled?: boolean
  configuration?: { [key: string]: any }
}

export type BotDefinitionRecurringEvent = {
  type: string
  payload: Record<string, any>
  schedule: {
    cron: string
  }
}

export type BotDefinitionEvent = {
  schema: Record<string, any>
}

export type BotDefinitionConfiguration = {
  schema: Record<string, any>
}

export type BotDefinitionUser = {
  tags?: Record<string, BotDefinitionTag>
}

export type BotDefinitionConversation = {
  tags?: Record<string, BotDefinitionTag>
}

export type BotDefinitionMessage = {
  tags?: Record<string, BotDefinitionTag>
}

export type BotDefinition = {
  user?: BotDefinitionUser
  conversation?: BotDefinitionConversation
  message?: BotDefinitionMessage
  states?: Record<string, BotDefinitionState>
  integrations?: IntegrationInstance[]
  configuration?: BotDefinitionConfiguration
  events?: Record<string, BotDefinitionEvent>
  recurringEvents?: Record<string, BotDefinitionRecurringEvent>
}

export class Bot {
  private _state: BotState = {
    registerHandlers: [],
    unregisterHandlers: [],
    messageHandlers: [],
    eventHandlers: [],
    stateExpiredHandlers: [],
  }

  public readonly definition: BotDefinition

  public constructor(def: BotDefinition = {}) {
    this.definition = def
  }

  public register = (_handler: RegisterHandler): void => {}
  public unregister = (_handler: UnregisterHandler): void => {}
  public message = (_type: string, handler: MessageHandler): void => {
    this._state.messageHandlers.push(handler)
  }
  public conversation = (_type: string, _handler: MessageHandler): void => {}
  public user = (_type: string, _handler: MessageHandler): void => {}
  public event = (_type: string, handler: EventHandler): void => {
    this._state.eventHandlers.push(handler)
  }
  public stateExpired = (_type: string, handler: StateExpiredHandler): void => {
    this._state.stateExpiredHandlers.push(handler)
  }

  public handler = createBotHandler(this._state)
  public start = (port?: number): Promise<Server> => serve(this.handler, port)
}

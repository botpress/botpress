import { IntegrationPackage } from '../package'
import { SchemaDefinition } from '../schema'
import { ValueOf, Writable } from '../utils/type-utils'
import z, { AnyZodObject } from '../zui'

type BaseStates = Record<string, AnyZodObject>
type BaseEvents = Record<string, AnyZodObject>

export type TagDefinition = {
  title?: string
  description?: string
}

export type StateType = 'conversation' | 'user' | 'bot'

export type StateDefinition<TState extends BaseStates[string] = BaseStates[string]> = SchemaDefinition<TState> & {
  type: StateType
  expiry?: number
}

export type RecurringEventDefinition<TEvents extends BaseEvents = BaseEvents> = {
  [K in keyof TEvents]: {
    type: K
    payload: z.infer<TEvents[K]>
    schedule: { cron: string }
  }
}[keyof TEvents]

export type EventDefinition<TEvent extends BaseEvents[string] = BaseEvents[string]> = SchemaDefinition<TEvent>

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

export type IntegrationConfigInstance<I extends IntegrationPackage = IntegrationPackage> =
  | {
      enabled: boolean
      configurationType: null
      configuration: z.infer<NonNullable<I['definition']['configuration']>['schema']>
    }
  | ValueOf<{
      [K in keyof NonNullable<I['definition']['configurations']>]: {
        enabled: boolean
        configurationType: K
        configuration: z.infer<NonNullable<I['definition']['configurations']>[K]['schema']>
      }
    }>

export type IntegrationInstance = IntegrationPackage & IntegrationConfigInstance

export type BotDefinitionProps<TStates extends BaseStates = BaseStates, TEvents extends BaseEvents = BaseEvents> = {
  integrations?: {
    [K: string]: IntegrationInstance
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
  recurringEvents?: Record<string, RecurringEventDefinition<TEvents>>
}

export class BotDefinition<TStates extends BaseStates = BaseStates, TEvents extends BaseEvents = BaseEvents> {
  public readonly integrations: this['props']['integrations']
  public readonly user: this['props']['user']
  public readonly conversation: this['props']['conversation']
  public readonly message: this['props']['message']
  public readonly states: this['props']['states']
  public readonly configuration: this['props']['configuration']
  public readonly events: this['props']['events']
  public readonly recurringEvents: this['props']['recurringEvents']
  public constructor(public readonly props: BotDefinitionProps<TStates, TEvents>) {
    this.integrations = props.integrations
    this.user = props.user
    this.conversation = props.conversation
    this.message = props.message
    this.states = props.states
    this.configuration = props.configuration
    this.events = props.events
    this.recurringEvents = props.recurringEvents
  }

  public add<I extends IntegrationPackage>(integrationPkg: I, config: IntegrationConfigInstance<I>): this {
    const self = this as Writable<BotDefinition>
    if (!self.integrations) {
      self.integrations = {}
    }

    self.integrations[integrationPkg.definition.name] = {
      enabled: config.enabled,
      ...integrationPkg,
      configurationType: config.configurationType as string,
      configuration: config.configuration,
    }
    return this
  }
}

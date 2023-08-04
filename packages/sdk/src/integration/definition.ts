import { SchemaDefinition } from '../schema'
import { AnyZodObject } from '../type-utils'

/**
 * Integration definition type argument for smart intellisense and type inference
 */
type TIntegrationDefinition = {
  configuration: AnyZodObject
  events: Record<string, AnyZodObject>
  actions: Record<string, Record<'input' | 'output', AnyZodObject>>
  channels: Record<string, Record<string, AnyZodObject>>
  states: Record<string, AnyZodObject>
}

type TagDefinition = {
  title?: string
  description?: string
}

type ConfigurationDefinition<TConfig extends TIntegrationDefinition['configuration']> = SchemaDefinition<TConfig>

type EventDefinition<TEvent extends TIntegrationDefinition['events'][string]> = SchemaDefinition<TEvent> & {
  title?: string
  description?: string
}

type ChannelDefinition<TChannel extends TIntegrationDefinition['channels'][string]> = {
  title?: string
  description?: string
  messages: {
    [K in keyof TChannel]: SchemaDefinition<TChannel[K]>
  }
  message?: {
    tags?: Record<string, TagDefinition>
  }
  conversation?: Partial<{
    tags: Record<string, TagDefinition>
    creation: {
      enabled: boolean
      requiredTags: string[]
    }
  }>
}

type ActionDefinition<TAction extends TIntegrationDefinition['actions'][string]> = {
  title?: string
  description?: string
  input: SchemaDefinition<TAction['input']>
  output: SchemaDefinition<TAction['output']>
}

type StateDefinition<TState extends TIntegrationDefinition['states'][string]> = SchemaDefinition<TState> & {
  type: 'integration' | 'conversation' | 'user'
}

type UserDefinition = Partial<{
  tags: Record<string, TagDefinition>
  creation: {
    enabled: boolean
    requiredTags: string[]
  }
}>

export type IntegrationDefinitionProps<T extends TIntegrationDefinition = TIntegrationDefinition> = {
  name: string
  version: '0.2.0' | '0.0.1' // TODO: allow any version

  title?: string
  description?: string
  icon?: string
  readme?: string

  configuration?: ConfigurationDefinition<T['configuration']>
  events?: { [K in keyof T['events']]: EventDefinition<T['events'][K]> }

  actions?: {
    [K in keyof T['actions']]: ActionDefinition<T['actions'][K]>
  }

  channels?: {
    [K in keyof T['channels']]: ChannelDefinition<T['channels'][K]>
  }

  states?: {
    [K in keyof T['states']]: StateDefinition<T['states'][K]>
  }

  user?: UserDefinition

  secrets?: string[]
}

export class IntegrationDefinition<T extends TIntegrationDefinition = TIntegrationDefinition> {
  public name: IntegrationDefinitionProps<T>['name']
  public version: IntegrationDefinitionProps<T>['version']
  public title: IntegrationDefinitionProps<T>['title']
  public description: IntegrationDefinitionProps<T>['description']
  public icon: IntegrationDefinitionProps<T>['icon']
  public readme: IntegrationDefinitionProps<T>['readme']
  public configuration: IntegrationDefinitionProps<T>['configuration']
  public events: IntegrationDefinitionProps<T>['events']
  public actions: IntegrationDefinitionProps<T>['actions']
  public channels: IntegrationDefinitionProps<T>['channels']
  public states: IntegrationDefinitionProps<T>['states']
  public user: IntegrationDefinitionProps<T>['user']
  public secrets: IntegrationDefinitionProps<T>['secrets']
  public constructor(props: IntegrationDefinitionProps<T>) {
    const {
      name,
      version,
      icon,
      readme,
      title,
      description,
      configuration,
      events,
      actions,
      channels,
      states,
      user,
      secrets,
    } = props
    this.name = name
    this.version = version
    this.icon = icon
    this.readme = readme
    this.title = title
    this.description = description
    this.configuration = configuration
    this.events = events
    this.actions = actions
    this.channels = channels
    this.states = states
    this.user = user
    this.secrets = secrets
  }
}

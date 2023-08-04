/* eslint-disable brace-style */
import { SchemaDefinition } from '../schema'
import { AnyZodObject } from '../type-utils'

type BaseConfig = AnyZodObject
type BaseEvents = Record<string, AnyZodObject>
type BaseActions = Record<string, Record<'input' | 'output', AnyZodObject>>
type BaseChannels = Record<string, Record<string, AnyZodObject>>
type BaseStates = Record<string, AnyZodObject>

export type TagDefinition = {
  title?: string
  description?: string
}

export type ConfigurationDefinition<TConfig extends BaseConfig> = SchemaDefinition<TConfig>

export type EventDefinition<TEvent extends BaseEvents[string]> = SchemaDefinition<TEvent> & {
  title?: string
  description?: string
}

export type ChannelDefinition<TChannel extends BaseChannels[string]> = {
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

export type ActionDefinition<TAction extends BaseActions[string]> = {
  title?: string
  description?: string
  input: SchemaDefinition<TAction['input']>
  output: SchemaDefinition<TAction['output']>
}

export type StateDefinition<TState extends BaseStates[string]> = SchemaDefinition<TState> & {
  type: 'integration' | 'conversation' | 'user'
}

export type UserDefinition = Partial<{
  tags: Record<string, TagDefinition>
  creation: {
    enabled: boolean
    requiredTags: string[]
  }
}>

export type IntegrationDefinitionProps<
  TConfig extends BaseConfig = BaseConfig,
  TEvents extends BaseEvents = BaseEvents,
  TActions extends BaseActions = BaseActions,
  TChannels extends BaseChannels = BaseChannels,
  TStates extends BaseStates = BaseStates
> = {
  name: string
  version: '0.2.0' | '0.0.1' // TODO: allow any version

  title?: string
  description?: string
  icon?: string
  readme?: string

  configuration?: ConfigurationDefinition<TConfig>
  events?: { [K in keyof TEvents]: EventDefinition<TEvents[K]> }

  actions?: {
    [K in keyof TActions]: ActionDefinition<TActions[K]>
  }

  channels?: {
    [K in keyof TChannels]: ChannelDefinition<TChannels[K]>
  }

  states?: {
    [K in keyof TStates]: StateDefinition<TStates[K]>
  }

  user?: UserDefinition

  secrets?: string[]
}

export class IntegrationDefinition<
  TConfig extends BaseConfig = BaseConfig,
  TEvents extends BaseEvents = BaseEvents,
  TActions extends BaseActions = BaseActions,
  TChannels extends BaseChannels = BaseChannels,
  TStates extends BaseStates = BaseStates
> implements IntegrationDefinitionProps<TConfig, TEvents, TActions, TChannels, TStates>
{
  public name: IntegrationDefinitionProps<TConfig, TEvents, TActions, TChannels, TStates>['name']
  public version: IntegrationDefinitionProps<TConfig, TEvents, TActions, TChannels, TStates>['version']
  public title: IntegrationDefinitionProps<TConfig, TEvents, TActions, TChannels, TStates>['title']
  public description: IntegrationDefinitionProps<TConfig, TEvents, TActions, TChannels, TStates>['description']
  public icon: IntegrationDefinitionProps<TConfig, TEvents, TActions, TChannels, TStates>['icon']
  public readme: IntegrationDefinitionProps<TConfig, TEvents, TActions, TChannels, TStates>['readme']
  public configuration: IntegrationDefinitionProps<TConfig, TEvents, TActions, TChannels, TStates>['configuration']
  public events: IntegrationDefinitionProps<TConfig, TEvents, TActions, TChannels, TStates>['events']
  public actions: IntegrationDefinitionProps<TConfig, TEvents, TActions, TChannels, TStates>['actions']
  public channels: IntegrationDefinitionProps<TConfig, TEvents, TActions, TChannels, TStates>['channels']
  public states: IntegrationDefinitionProps<TConfig, TEvents, TActions, TChannels, TStates>['states']
  public user: IntegrationDefinitionProps<TConfig, TEvents, TActions, TChannels, TStates>['user']
  public secrets: IntegrationDefinitionProps<TConfig, TEvents, TActions, TChannels, TStates>['secrets']

  public constructor(props: IntegrationDefinitionProps<TConfig, TEvents, TActions, TChannels, TStates>) {
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

import { SchemaDefinition } from '../schema'
import { AnyZodObject } from '../type-utils'

type BaseConfig = AnyZodObject
type BaseEvents = Record<string, AnyZodObject>
type BaseActions = Record<string, Record<'input' | 'output', AnyZodObject>>
type BaseChannels = Record<string, Record<string, AnyZodObject>>
type BaseStates = Record<string, AnyZodObject>

type TagDefinition = {
  title?: string
  description?: string
}

type ConfigurationDefinition<TConfig extends BaseConfig> = SchemaDefinition<TConfig> & {
  identifier?: {
    required?: boolean
    linkTemplateScript?: string
  }
}

type EventDefinition<TEvent extends BaseEvents[string]> = SchemaDefinition<TEvent> & {
  title?: string
  description?: string
}

type ChannelDefinition<TChannel extends BaseChannels[string]> = {
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

type ActionDefinition<TAction extends BaseActions[string]> = {
  title?: string
  description?: string
  input: SchemaDefinition<TAction['input']>
  output: SchemaDefinition<TAction['output']>
}

type StateDefinition<TState extends BaseStates[string]> = SchemaDefinition<TState> & {
  type: 'integration' | 'conversation' | 'user'
}

type UserDefinition = Partial<{
  tags: Record<string, TagDefinition>
  creation: {
    enabled: boolean
    requiredTags: string[]
  }
}>

type SecretDefinition = {
  optional?: boolean
  description?: string
}

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

  identifier?: {
    extractScript?: string
    fallbackHandlerScript?: string
  }

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

  secrets?: Record<string, SecretDefinition>
}

export class IntegrationDefinition<
  TConfig extends BaseConfig = BaseConfig,
  TEvents extends BaseEvents = BaseEvents,
  TActions extends BaseActions = BaseActions,
  TChannels extends BaseChannels = BaseChannels,
  TStates extends BaseStates = BaseStates
> {
  public readonly name: IntegrationDefinitionProps<TConfig, TEvents, TActions, TChannels, TStates>['name']
  public readonly version: IntegrationDefinitionProps<TConfig, TEvents, TActions, TChannels, TStates>['version']
  public readonly title: IntegrationDefinitionProps<TConfig, TEvents, TActions, TChannels, TStates>['title']
  public readonly description: IntegrationDefinitionProps<TConfig, TEvents, TActions, TChannels, TStates>['description']
  public readonly icon: IntegrationDefinitionProps<TConfig, TEvents, TActions, TChannels, TStates>['icon']
  public readonly readme: IntegrationDefinitionProps<TConfig, TEvents, TActions, TChannels, TStates>['readme']
  public readonly configuration: IntegrationDefinitionProps<
    TConfig,
    TEvents,
    TActions,
    TChannels,
    TStates
  >['configuration']
  public readonly events: IntegrationDefinitionProps<TConfig, TEvents, TActions, TChannels, TStates>['events']
  public readonly actions: IntegrationDefinitionProps<TConfig, TEvents, TActions, TChannels, TStates>['actions']
  public readonly channels: IntegrationDefinitionProps<TConfig, TEvents, TActions, TChannels, TStates>['channels']
  public readonly states: IntegrationDefinitionProps<TConfig, TEvents, TActions, TChannels, TStates>['states']
  public readonly user: IntegrationDefinitionProps<TConfig, TEvents, TActions, TChannels, TStates>['user']
  public readonly secrets: IntegrationDefinitionProps<TConfig, TEvents, TActions, TChannels, TStates>['secrets']
  public readonly identifier: IntegrationDefinitionProps<TConfig, TEvents, TActions, TChannels, TStates>['identifier']

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
      identifier,
    } = props
    this.name = name
    this.version = version
    this.icon = icon
    this.readme = readme
    this.title = title
    this.identifier = identifier
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

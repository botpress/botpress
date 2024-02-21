import { SchemaDefinition } from '../schema'
import { AnyZodObject } from '../type-utils'

type BaseConfig = AnyZodObject
type BaseEvents = Record<string, AnyZodObject>
type BaseActions = Record<string, AnyZodObject>
type BaseChannels = Record<string, Record<string, AnyZodObject>>
type BaseStates = Record<string, AnyZodObject>
type BaseEntities = Record<string, AnyZodObject>

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
    /**
     * @deprecated
     */
    creation: {
      enabled: boolean
      requiredTags: string[]
    }
  }>
}

type ActionDefinition<TAction extends BaseActions[string]> = {
  title?: string
  description?: string
  input: SchemaDefinition<TAction>
  output: SchemaDefinition<AnyZodObject> // cannot infer both input and output types (typescript limitation)
}

type StateDefinition<TState extends BaseStates[string]> = SchemaDefinition<TState> & {
  type: 'integration' | 'conversation' | 'user'
}

type UserDefinition = Partial<{
  tags: Record<string, TagDefinition>
  /**
   * @deprecated
   */
  creation: {
    enabled: boolean
    requiredTags: string[]
  }
}>

type SecretDefinition = {
  optional?: boolean
  description?: string
}

type EntityDefinition<TEntity extends BaseEntities[string]> = SchemaDefinition<TEntity> & {
  title?: string
  description?: string
}

export type IntegrationDefinitionProps<
  TConfig extends BaseConfig = BaseConfig,
  TEvents extends BaseEvents = BaseEvents,
  TActions extends BaseActions = BaseActions,
  TChannels extends BaseChannels = BaseChannels,
  TStates extends BaseStates = BaseStates,
  TEntities extends BaseEntities = BaseEntities
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

  entities?: {
    [K in keyof TEntities]: EntityDefinition<TEntities[K]>
  }
}

export class IntegrationDefinition<
  TConfig extends BaseConfig = BaseConfig,
  TEvents extends BaseEvents = BaseEvents,
  TActions extends BaseActions = BaseActions,
  TChannels extends BaseChannels = BaseChannels,
  TStates extends BaseStates = BaseStates,
  TEntities extends BaseEntities = BaseEntities
> {
  public readonly name: this['props']['name']
  public readonly version: this['props']['version']
  public readonly title: this['props']['title']
  public readonly description: this['props']['description']
  public readonly icon: this['props']['icon']
  public readonly readme: this['props']['readme']
  public readonly configuration: this['props']['configuration']
  public readonly events: this['props']['events']
  public readonly actions: this['props']['actions']
  public readonly channels: this['props']['channels']
  public readonly states: this['props']['states']
  public readonly user: this['props']['user']
  public readonly secrets: this['props']['secrets']
  public readonly identifier: this['props']['identifier']
  public readonly entities: this['props']['entities']

  public constructor(
    public readonly props: IntegrationDefinitionProps<TConfig, TEvents, TActions, TChannels, TStates, TEntities>
  ) {
    this.name = props.name
    this.version = props.version
    this.icon = props.icon
    this.readme = props.readme
    this.title = props.title
    this.identifier = props.identifier
    this.description = props.description
    this.configuration = props.configuration
    this.events = props.events
    this.actions = props.actions
    this.channels = props.channels
    this.states = props.states
    this.user = props.user
    this.secrets = props.secrets
    this.entities = props.entities
  }
}

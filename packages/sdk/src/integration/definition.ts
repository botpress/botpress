import { SchemaDefinition } from '../schema'
import { AnyZodObject } from '../type-utils'

type BaseConfig = AnyZodObject
type BaseEvents = Record<string, AnyZodObject>
type BaseActions = Record<string, Record<'input' | 'output', AnyZodObject>>
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
  input: SchemaDefinition<TAction['input']>
  output: SchemaDefinition<TAction['output']>
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

type EntityOperation = 'create' | 'read' | 'update' | 'delete' | 'list'
type EntityNotification = 'created' | 'updated' | 'deleted'
type EntityDefinition<TEntity extends AnyZodObject> = SchemaDefinition<TEntity> & {
  title?: string
  description?: string
  operations?: Partial<Record<EntityOperation, boolean>>
  notification?: Partial<Record<EntityNotification, boolean>>
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
  TEntities extends BaseEntities = BaseEntities,
  TProps extends IntegrationDefinitionProps<
    TConfig,
    TEvents,
    TActions,
    TChannels,
    TStates,
    TEntities
  > = IntegrationDefinitionProps<TConfig, TEvents, TActions, TChannels, TStates, TEntities>
> {
  public readonly name: TProps['name']
  public readonly version: TProps['version']
  public readonly title: TProps['title']
  public readonly description: TProps['description']
  public readonly icon: TProps['icon']
  public readonly readme: TProps['readme']
  public readonly configuration: TProps['configuration']
  public readonly events: TProps['events']
  public readonly actions: TProps['actions']
  public readonly channels: TProps['channels']
  public readonly states: TProps['states']
  public readonly user: TProps['user']
  public readonly secrets: TProps['secrets']
  public readonly identifier: TProps['identifier']
  public readonly entities: TProps['entities']
  public constructor(props: TProps) {
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
      entities,
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
    this.entities = entities
  }
}

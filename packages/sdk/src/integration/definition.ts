import { mapValues } from 'radash'
import { SchemaDefinition, schemaDefinitionToJsonSchema } from '../schema'
import { AnyZodObject, Cast, Iof, Merge } from '../type-utils'

const PUBLIC_VERSION = '0.2.0' as const
const PRIVATE_VERSION = '0.0.1' as const

export type JsonSchema = Record<string, any>

export type TagDefinition = {
  title?: string
  description?: string
}

export type ConfigurationDefinition = {
  schema: JsonSchema
}

export type EventDefinition = {
  title?: string
  description?: string
  schema: JsonSchema
}

export type ChannelDefinition = {
  title?: string
  description?: string
  messages: Record<string, MessageDefinition>
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

export type ActionDefinition = {
  title?: string
  description?: string
  input: { schema: JsonSchema }
  output: { schema: JsonSchema }
}

export type MessageDefinition = {
  schema: JsonSchema
}

export type StateDefinition = {
  type: 'integration' | 'conversation' | 'user'
  schema: JsonSchema
}

export type UserDefinition = Partial<{
  tags: Record<string, TagDefinition>
  creation: {
    enabled: boolean
    requiredTags: string[]
  }
}>

type BaseConfig = AnyZodObject
type BaseEvents = Record<string, AnyZodObject>
type BaseActions = Record<string, Record<'input' | 'output', AnyZodObject>>
type BaseChannels = Record<string, Record<string, AnyZodObject>>
type BaseStates = Record<string, AnyZodObject>

export type IntegrationDefinitionProps<
  TConfig extends BaseConfig = BaseConfig,
  TEvent extends BaseEvents = BaseEvents,
  TAction extends BaseActions = BaseActions,
  TChannel extends BaseChannels = BaseChannels,
  TState extends BaseStates = BaseStates
> = {
  name: string
  version: typeof PUBLIC_VERSION | typeof PRIVATE_VERSION // TODO: allow any versions

  title?: string
  description?: string
  icon?: string
  readme?: string

  configuration?: Merge<ConfigurationDefinition, SchemaDefinition<TConfig>>
  events?: { [K in keyof TEvent]: Merge<EventDefinition, SchemaDefinition<TEvent[K]>> }

  actions?: {
    [K in keyof TAction]: Merge<
      ActionDefinition,
      {
        ['input']: SchemaDefinition<Cast<TAction[K]['input'], AnyZodObject>>
        ['output']: SchemaDefinition<Cast<TAction[K]['output'], AnyZodObject>>
      }
    >
  }

  channels?: {
    [K in keyof TChannel]: Merge<
      ChannelDefinition,
      {
        messages: {
          [L in keyof TChannel[K]]: Merge<MessageDefinition, SchemaDefinition<TChannel[K][L]>>
        }
      }
    >
  }

  states?: {
    [K in keyof TState]: Merge<StateDefinition, SchemaDefinition<TState[K]>>
  }

  user?: UserDefinition

  secrets?: string[]
}

const propsToDefinition = (
  props: IntegrationDefinitionProps<BaseConfig, BaseEvents, BaseActions, BaseChannels, BaseStates>
): Iof<IntegrationDefinition> => ({
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
  actions: props.actions
    ? mapValues(props.actions, (action) => ({
        ...action,
        input: {
          ...action.input,
          schema: schemaDefinitionToJsonSchema(action.input),
        },
        output: {
          ...action.output,
          schema: schemaDefinitionToJsonSchema(action.output),
        },
      }))
    : undefined,
  channels: props.channels
    ? mapValues(props.channels, (channel) => ({
        ...channel,
        messages: mapValues(channel.messages, (message) => ({
          ...message,
          schema: schemaDefinitionToJsonSchema(message),
        })),
      }))
    : undefined,
  states: props.states
    ? mapValues(props.states, (state) => ({
        ...state,
        schema: schemaDefinitionToJsonSchema(state),
      }))
    : undefined,
})

export class IntegrationDefinition<
  TConfig extends BaseConfig = BaseConfig,
  TEvents extends BaseEvents = BaseEvents,
  TActions extends BaseActions = BaseActions,
  TChannels extends BaseChannels = BaseChannels,
  TStates extends BaseStates = BaseStates
> {
  public readonly name: string
  public readonly version: typeof PUBLIC_VERSION | typeof PRIVATE_VERSION // TODO: allow any versions
  public readonly title?: string
  public readonly description?: string
  public readonly icon?: string
  public readonly readme?: string
  public readonly configuration?: ConfigurationDefinition
  public readonly events?: Record<string, EventDefinition>
  public readonly actions?: Record<string, ActionDefinition>
  public readonly channels?: Record<string, ChannelDefinition>
  public readonly states?: Record<string, StateDefinition>
  public readonly user?: UserDefinition
  public readonly secrets?: string[]

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
    } = propsToDefinition(props)
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

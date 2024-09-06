import { SchemaDefinition } from '../../schema'
import { AnyZodObject } from '../../type-utils'
import {
  BaseConfig,
  BaseEvents,
  BaseActions,
  BaseMessages,
  BaseChannels,
  BaseStates,
  BaseEntities,
  BaseConfigs,
} from './generic'

export type TagDefinition = {
  title?: string
  description?: string
}

export type ConfigurationDefinition<TConfig extends BaseConfig = BaseConfig> = SchemaDefinition<TConfig> & {
  identifier?: {
    required?: boolean
    linkTemplateScript?: string
  }
}

export type AdditionalConfigurationDefinition<TConfig extends BaseConfigs[string] = BaseConfigs[string]> =
  ConfigurationDefinition<TConfig> & {
    title?: string
    description?: string
  }

export type EventDefinition<TEvent extends BaseEvents[string] = BaseEvents[string]> = SchemaDefinition<TEvent> & {
  title?: string
  description?: string
}

export type MessageDefinition<TMessage extends BaseMessages[string] = BaseMessages[string]> = SchemaDefinition<TMessage>

export type ChannelDefinition<TChannel extends BaseChannels[string] = BaseChannels[string]> = {
  title?: string
  description?: string
  messages: {
    [K in keyof TChannel]: MessageDefinition<TChannel[K]>
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

export type ActionDefinition<TAction extends BaseActions[string] = BaseActions[string]> = {
  title?: string
  description?: string
  input: SchemaDefinition<TAction>
  output: SchemaDefinition<AnyZodObject> // cannot infer both input and output types (typescript limitation)
  billable?: boolean
  cacheable?: boolean
}

export type StateDefinition<TState extends BaseStates[string] = BaseStates[string]> = SchemaDefinition<TState> & {
  type: 'integration' | 'conversation' | 'user'
}

export type UserDefinition = Partial<{
  tags: Record<string, TagDefinition>
  /**
   * @deprecated
   */
  creation: {
    enabled: boolean
    requiredTags: string[]
  }
}>

export type SecretDefinition = {
  optional?: boolean
  description?: string
}

export type EntityDefinition<TEntity extends BaseEntities[string] = BaseEntities[string]> =
  SchemaDefinition<TEntity> & {
    title?: string
    description?: string
  }

export type ResolvedInterface<
  TEvents extends BaseEvents = BaseEvents,
  TActions extends BaseActions = BaseActions,
  TChannels extends BaseChannels = BaseChannels
> = {
  actions: { [K in keyof TActions]: ActionDefinition<TActions[K]> }
  events: { [K in keyof TEvents]: EventDefinition<TEvents[K]> }
  channels: { [K in keyof TChannels]: ChannelDefinition<TChannels[K]> }
}

export type InterfaceImplementationStatement = {
  name: string
  version: string
  entities: Record<string, { name: string }>
  actions: Record<string, { name: string }>
  events: Record<string, { name: string }>
}

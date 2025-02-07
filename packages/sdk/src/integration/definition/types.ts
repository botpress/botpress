import { SchemaDefinition } from '../../schema'
import { ZuiObjectSchema } from '../../zui'
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
  output: SchemaDefinition<ZuiObjectSchema> // cannot infer both input and output types (typescript limitation)
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
  TChannels extends BaseChannels = BaseChannels,
> = {
  actions: { [K in keyof TActions]: ActionDefinition<TActions[K]> }
  events: { [K in keyof TEvents]: EventDefinition<TEvents[K]> }
  channels: { [K in keyof TChannels]: ChannelDefinition<TChannels[K]> }
}

/**
 * A.K.A. Interface Implementation Statetement
 * Used by an integration to explicitly declare that it implements an interface
 */
export type InterfaceExtension<
  TEntities extends BaseEntities = BaseEntities,
  TActions extends BaseActions = BaseActions,
  TEvents extends BaseEvents = BaseEvents,
  TChannels extends BaseChannels = BaseChannels,
> = {
  id?: string // id of the interface to implement
  name: string // name of the interface to implement
  version: string // version of the interface to implement
  entities: { [K in keyof TEntities]: { name: string } }
  actions: { [K in keyof TActions]: { name: string } }
  events: { [K in keyof TEvents]: { name: string } }
  channels: { [K in keyof TChannels]: { name: string } }
}

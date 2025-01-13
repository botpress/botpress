import * as types from '../../typings'
export type IntegrationDefinition = types.IntegrationDefinition
export type ActionDefinition = NonNullable<IntegrationDefinition['actions']>[string]
export type ChannelDefinition = NonNullable<IntegrationDefinition['channels']>[string]
export type MessageDefinition = NonNullable<ChannelDefinition['messages']>[string]
export type ConfigurationDefinition = NonNullable<IntegrationDefinition['configurations']>[string]
export type EntityDefinition = NonNullable<IntegrationDefinition['entities']>[string]
export type EventDefinition = NonNullable<IntegrationDefinition['events']>[string]
export type StateDefinition = NonNullable<IntegrationDefinition['states']>[string]
export type InterfaceExtension = NonNullable<IntegrationDefinition['interfaces']>[string]

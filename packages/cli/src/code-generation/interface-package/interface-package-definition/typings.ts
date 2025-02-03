import * as types from '../../typings'
export type InterfaceDefinition = types.InterfaceDefinition
export type ActionDefinition = NonNullable<InterfaceDefinition['actions']>[string]
export type ChannelDefinition = NonNullable<InterfaceDefinition['channels']>[string]
export type MessageDefinition = NonNullable<ChannelDefinition['messages']>[string]
export type EntityDefinition = NonNullable<InterfaceDefinition['entities']>[string]
export type EventDefinition = NonNullable<InterfaceDefinition['events']>[string]

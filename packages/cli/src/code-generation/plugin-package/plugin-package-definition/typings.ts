import * as types from '../../typings'
export type PluginDefinition = types.PluginDefinition
export type ActionDefinition = NonNullable<PluginDefinition['actions']>[string]
export type ConfigurationDefinition = NonNullable<PluginDefinition['configuration']>
export type EventDefinition = NonNullable<PluginDefinition['events']>[string]
export type StateDefinition = NonNullable<PluginDefinition['states']>[string]
export type InterfaceDefinition = types.InterfaceDefinition

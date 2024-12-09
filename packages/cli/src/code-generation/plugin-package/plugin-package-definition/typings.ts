import * as client from '@botpress/client'
export type ApiPluginDefinition = client.Plugin
export type ApiActionDefinition = ApiPluginDefinition['actions'][string]
export type ApiConfigurationDefinition = ApiPluginDefinition['configuration']
export type ApiEventDefinition = ApiPluginDefinition['events'][string]
export type ApiStateDefinition = ApiPluginDefinition['states'][string]

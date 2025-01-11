import * as apiUtils from '../../../api'
export type ApiPluginDefinition = apiUtils.InferredPluginResponseBody
export type ApiActionDefinition = ApiPluginDefinition['actions'][string]
export type ApiConfigurationDefinition = ApiPluginDefinition['configuration']
export type ApiEventDefinition = ApiPluginDefinition['events'][string]
export type ApiStateDefinition = ApiPluginDefinition['states'][string]

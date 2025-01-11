import * as apiUtils from '../../../api'
export type ApiIntegrationDefinition = apiUtils.InferredIntegrationResponseBody
export type ApiActionDefinition = ApiIntegrationDefinition['actions'][string]
export type ApiChannelDefinition = ApiIntegrationDefinition['channels'][string]
export type ApiMessageDefinition = ApiChannelDefinition['messages'][string]
export type ApiConfigurationDefinition = ApiIntegrationDefinition['configurations'][string]
export type ApiEntityDefinition = ApiIntegrationDefinition['entities'][string]
export type ApiEventDefinition = ApiIntegrationDefinition['events'][string]
export type ApiStateDefinition = ApiIntegrationDefinition['states'][string]
export type ApiInterfaceExtension = ApiIntegrationDefinition['interfaces'][string]

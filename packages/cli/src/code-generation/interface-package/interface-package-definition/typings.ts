import * as client from '@botpress/client'
export type ApiInterfaceDefinition = client.Interface
export type ApiActionDefinition = ApiInterfaceDefinition['actions'][string]
export type ApiChannelDefinition = ApiInterfaceDefinition['channels'][string]
export type ApiMessageDefinition = ApiChannelDefinition['messages'][string]
export type ApiEntityDefinition = ApiInterfaceDefinition['entities'][string]
export type ApiEventDefinition = ApiInterfaceDefinition['events'][string]

import * as client from '@botpress/client'
import { Logger } from '../logger'
import { SafeOmit } from '../utils/type-utils'
import { ApiClient } from './client'

export type ApiClientProps = {
  apiUrl: string
  token: string
  workspaceId: string
}

export type ApiClientFactory = {
  newClient: (props: ApiClientProps, logger: Logger) => ApiClient
}

export type PublicIntegration = client.Integration
export type PrivateIntegration = client.Integration & { workspaceId: string }
export type Integration = client.Integration & { workspaceId?: string }
export type IntegrationSummary = client.ClientOutputs['listIntegrations']['integrations'][number]
export type BotSummary = client.ClientOutputs['listBots']['bots'][number]
export type Interface = client.Interface
export type Plugin = client.Plugin

export type CreateBotRequestBody = client.ClientInputs['createBot']
export type UpdateBotRequestBody = client.ClientInputs['updateBot']
export type CreateInterfaceRequestBody = client.ClientInputs['createInterface']
export type UpdateInterfaceRequestBody = client.ClientInputs['updateInterface']
export type CreatePluginRequestBody = SafeOmit<client.ClientInputs['createPlugin'], 'code'>
export type UpdatePluginRequestBody = client.ClientInputs['updatePlugin']

export type CreateIntegrationRequestBody = client.ClientInputs['createIntegration']
export type UpdateIntegrationRequestBody = client.ClientInputs['updateIntegration']

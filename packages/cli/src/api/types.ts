import * as client from '@botpress/client'
import { Logger } from '../logger'
import { SafeOmit, Merge } from '../utils/type-utils'
import { ApiClient } from './client'

export type ApiClientProps = {
  apiUrl: string
  token: string
  workspaceId: string
  botId?: string
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

export type CreateIntegrationRequestBody = client.ClientInputs['createIntegration']
export type UpdateIntegrationRequestBody = client.ClientInputs['updateIntegration']

export type CreateInterfaceRequestBody = client.ClientInputs['createInterface']
export type UpdateInterfaceRequestBody = client.ClientInputs['updateInterface']

type PluginDependency = client.Plugin['dependencies']['integrations'][string]

export type CreatePluginRequestBody = Merge<
  SafeOmit<client.ClientInputs['createPlugin'], 'code'>,
  {
    dependencies?: {
      integrations?: Record<string, PluginDependency>
      interfaces?: Record<string, PluginDependency>
    }
  }
>

export type UpdatePluginRequestBody = Merge<
  client.ClientInputs['updatePlugin'],
  {
    dependencies?: {
      integrations?: Record<string, PluginDependency | null>
      interfaces?: Record<string, PluginDependency | null>
    }
  }
>

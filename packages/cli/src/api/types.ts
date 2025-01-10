import * as client from '@botpress/client'
import * as log from '../logger'
import * as utils from '../utils'
import { ApiClient } from './client'

export type ApiClientProps = {
  apiUrl: string
  token: string
  workspaceId: string
}

export type ApiClientFactory = {
  newClient: (props: ApiClientProps, logger: log.Logger) => ApiClient
}

type NoCode<T extends { code: string }> = utils.types.SafeOmit<T, 'code'>

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
export type CreatePluginRequestBody = NoCode<client.ClientInputs['createPlugin']>
export type UpdatePluginRequestBody = client.ClientInputs['updatePlugin']

export type InferredIntegrationResponseBody = utils.types.Merge<client.Integration, { id?: string | undefined }>
export type InferredInterfaceResponseBody = utils.types.Merge<client.Interface, { id?: string | undefined }>
export type InferredPluginResponseBody = NoCode<utils.types.Merge<client.Plugin, { id?: string | undefined }>>

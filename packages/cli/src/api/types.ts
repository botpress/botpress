import * as client from '@botpress/client'
import { Logger } from '../logger'
import { SafeOmit, Merge } from '../utils/type-utils'
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

/**
 * Actual createIntegration request body, but interfaces have name and version
 */
export type CreateIntegrationRequestBody = Merge<
  client.ClientInputs['createIntegration'],
  {
    interfaces?: Record<
      string,
      Merge<
        NonNullable<client.ClientInputs['createIntegration']['interfaces']>[string],
        {
          name: string
          version: string
        }
      >
    >
  }
>

/**
 * Actual updateIntegration request body, but interfaces have name and version
 */
export type UpdateIntegrationRequestBody = Merge<
  client.ClientInputs['updateIntegration'],
  {
    interfaces?: Record<
      string,
      null | Merge<
        NonNullable<NonNullable<client.ClientInputs['updateIntegration']['interfaces']>[string]>,
        {
          name: string
          version: string
        }
      >
    >
  }
>

export type InferredIntegrationResponseBody = Merge<client.Integration, { id?: string | undefined }>
export type InferredInterfaceResponseBody = Merge<client.Interface, { id?: string | undefined }>
export type InferredPluginResponseBody = SafeOmit<Merge<client.Plugin, { id?: string | undefined }>, 'code'>

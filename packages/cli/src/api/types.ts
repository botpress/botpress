import * as client from '@botpress/client'
import { Logger } from 'src/logger'
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

export type Interface = client.Interface

export type BaseOperation = (...args: any[]) => Promise<any>
export type Operations = {
  [K in keyof client.Client as client.Client[K] extends BaseOperation ? K : never]: client.Client[K]
}
export type Requests = {
  [K in keyof Operations]: Parameters<Operations[K]>[0]
}
export type Responses = {
  [K in keyof Operations]: ReturnType<Operations[K]>
}

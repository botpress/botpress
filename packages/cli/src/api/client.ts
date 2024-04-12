import * as client from '@botpress/client'
import _ from 'lodash'
import { formatIntegrationRef, ApiIntegrationRef as IntegrationRef } from '../integration-ref'
import type { Logger } from '../logger'
import * as paging from './paging'

export type PageLister<R extends object> = (t: { nextToken?: string }) => Promise<R & { meta: { nextToken?: string } }>

export type ApiClientProps = {
  apiUrl: string
  token: string
  workspaceId: string
}

export type ApiClientFactory = {
  newClient: (props: ApiClientProps, logger: Logger) => ApiClient
}

type PublicIntegration = client.Integration
type PrivateIntegration = client.Integration & { workspaceId: string }
type Integration = client.Integration & { workspaceId?: string }

type BaseOperation = (...args: any[]) => Promise<any>
type Operations = {
  [K in keyof client.Client as client.Client[K] extends BaseOperation ? K : never]: client.Client[K]
}
type Requests = {
  [K in keyof Operations]: Parameters<Operations[K]>[0]
}
type Responses = {
  [K in keyof Operations]: ReturnType<Operations[K]>
}

/**
 * This class is used to wrap the Botpress API and provide a more convenient way to interact with it.
 */
export class ApiClient {
  public readonly client: client.Client
  public readonly url: string
  public readonly token: string
  public readonly workspaceId: string

  public static newClient = (props: ApiClientProps, logger: Logger) => new ApiClient(props, logger)

  public constructor(props: ApiClientProps, private _logger: Logger) {
    const { apiUrl, token, workspaceId } = props
    this.client = new client.Client({ apiUrl, token, workspaceId })
    this.url = apiUrl
    this.token = token
    this.workspaceId = workspaceId
  }

  public get isBotpressWorkspace(): boolean {
    return [
      '6a76fa10-e150-4ff6-8f59-a300feec06c1',
      '95de33eb-1551-4af9-9088-e5dcb02efd09',
      '11111111-1111-1111-aaaa-111111111111',
    ].includes(this.workspaceId)
  }

  public async getWorkspace(): Promise<Responses['getWorkspace']> {
    return this.client.getWorkspace({ id: this.workspaceId })
  }

  public async updateWorkspace(props: Omit<Requests['updateWorkspace'], 'id'>): Promise<Responses['updateWorkspace']> {
    return this.client.updateWorkspace({ id: this.workspaceId, ...props })
  }

  public async findIntegration(ref: IntegrationRef): Promise<Integration | undefined> {
    const formatted = formatIntegrationRef(ref)

    const privateIntegration = await this.findPrivateIntegration(ref)
    if (privateIntegration) {
      this._logger.debug(`Found integration "${formatted}" in workspace`)
      return privateIntegration
    }

    const publicIntegration = await this.findPublicIntegration(ref)
    if (publicIntegration) {
      this._logger.debug(`Found integration "${formatted}" in hub`)
      return publicIntegration
    }

    return
  }

  public async findPrivateIntegration(ref: IntegrationRef): Promise<PrivateIntegration | undefined> {
    const { workspaceId } = this
    if (ref.type === 'id') {
      return this.validateStatus(
        () => this.client.getIntegration(ref).then((r) => ({ ...r.integration, workspaceId })),
        404
      )
    }
    return this.validateStatus(
      () => this.client.getIntegrationByName(ref).then((r) => ({ ...r.integration, workspaceId })),
      404
    )
  }

  public async findPublicIntegration(ref: IntegrationRef): Promise<PublicIntegration | undefined> {
    if (ref.type === 'id') {
      return this.validateStatus(() => this.client.getPublicIntegrationById(ref).then((r) => r.integration), 404)
    }
    return this.validateStatus(() => this.client.getPublicIntegration(ref).then((r) => r.integration), 404)
  }

  public async testLogin(): Promise<void> {
    await this.client.listBots({})
  }

  public listAllPages = paging.listAllPages

  public async validateStatus<V>(fn: () => Promise<V>, allowedStatuses: number | number[]): Promise<V | undefined> {
    try {
      const v = await fn()
      return v
    } catch (err) {
      const allowedStatusesArray = _.isArray(allowedStatuses) ? allowedStatuses : [allowedStatuses]
      const isAllowed = client.isApiError(err) && err.code && allowedStatusesArray.includes(err.code)
      if (isAllowed) {
        return
      }
      throw err
    }
  }
}

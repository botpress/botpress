import { Client, Integration, isApiError } from '@botpress/client'
import _ from 'lodash'
import { formatIntegrationRef, IntegrationRef } from './integration-ref'
import type { Logger } from './logger'

export type PageLister<R extends object> = (t: { nextToken?: string }) => Promise<R & { meta: { nextToken?: string } }>

export type ApiClientProps = {
  apiUrl: string
  token: string
  workspaceId?: string
}

export type ApiClientFactory = {
  newClient: (props: ApiClientProps, logger: Logger) => ApiClient
}

/**
 * This class is used to wrap the Botpress API and provide a more convenient way to interact with it.
 */
export class ApiClient {
  public readonly client: Client
  public readonly url: string
  public readonly token: string
  public readonly workspaceId?: string

  public static newClient = (props: ApiClientProps, logger: Logger) => new ApiClient(props, logger)

  public constructor(props: ApiClientProps, private _logger: Logger) {
    const { apiUrl, token, workspaceId } = props
    this.client = new Client({ host: apiUrl, token, workspaceId })
    this.url = apiUrl
    this.token = token
    this.workspaceId = workspaceId
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

  public async findPrivateIntegration(ref: IntegrationRef): Promise<Integration | undefined> {
    if (ref.type === 'id') {
      return this.validateStatus(() => this.client.getIntegration(ref).then((r) => r.integration), 404)
    }
    return this.validateStatus(() => this.client.getIntegrationByName(ref).then((r) => r.integration), 404)
  }

  public async findPublicIntegration(ref: IntegrationRef): Promise<Integration | undefined> {
    if (ref.type === 'id') {
      return this.validateStatus(() => this.client.getPublicIntegrationById(ref).then((r) => r.integration), 404)
    }
    return this.validateStatus(() => this.client.getPublicIntegration(ref).then((r) => r.integration), 404)
  }

  public async testLogin(): Promise<void> {
    await this.client.listBots({})
  }

  public async listAllPages<R extends object>(lister: PageLister<R>): Promise<R[]>
  public async listAllPages<R extends object, M>(lister: PageLister<R>, mapper?: (r: R) => M[]): Promise<M[]>
  public async listAllPages<R extends object, M>(lister: PageLister<R>, mapper?: (r: R) => M[]) {
    let nextToken: string | undefined
    const all: R[] = []

    do {
      const { meta, ...r } = await lister({ nextToken })
      all.push(r as R)
      nextToken = meta.nextToken
    } while (nextToken)

    if (!mapper) {
      return all
    }

    const mapped: M[] = all.flatMap((r) => mapper(r))
    return mapped
  }

  public async validateStatus<V>(fn: () => Promise<V>, allowedStatuses: number | number[]): Promise<V | undefined> {
    try {
      const v = await fn()
      return v
    } catch (err) {
      const allowedStatusesArray = _.isArray(allowedStatuses) ? allowedStatuses : [allowedStatuses]
      const isAllowed = isApiError(err) && err.code && allowedStatusesArray.includes(err.code)
      if (isAllowed) {
        return
      }
      throw err
    }
  }
}

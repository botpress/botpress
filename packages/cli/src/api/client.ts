import * as client from '@botpress/client'
import type { Logger } from '../logger'
import { formatPackageRef, ApiPackageRef, NamePackageRef } from '../package-ref'
import { findPreviousIntegrationVersion } from './find-previous-version'
import * as paging from './paging'
import {
  ApiClientProps,
  PublicIntegration,
  PrivateIntegration,
  Integration,
  Requests,
  Responses,
  Interface,
  BotSummary,
} from './types'

export * from './types'

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

  public async findIntegration(ref: ApiPackageRef): Promise<Integration | undefined> {
    const formatted = formatPackageRef(ref)

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

  public async findPrivateIntegration(ref: ApiPackageRef): Promise<PrivateIntegration | undefined> {
    const { workspaceId } = this
    if (ref.type === 'id') {
      return this.client
        .getIntegration(ref)
        .then((r) => ({ ...r.integration, workspaceId }))
        .catch(this._returnUndefinedOnError('ResourceNotFound'))
    }
    return this.client
      .getIntegrationByName(ref)
      .then((r) => ({ ...r.integration, workspaceId }))
      .catch(this._returnUndefinedOnError('ResourceNotFound'))
  }

  public async findPublicIntegration(ref: ApiPackageRef): Promise<PublicIntegration | undefined> {
    if (ref.type === 'id') {
      return this.client
        .getPublicIntegrationById(ref)
        .then((r) => r.integration)
        .catch(this._returnUndefinedOnError('ResourceNotFound'))
    }
    return this.client
      .getPublicIntegration(ref)
      .then((r) => r.integration)
      .catch(this._returnUndefinedOnError('ResourceNotFound'))
  }

  public async findPublicInterface(ref: ApiPackageRef): Promise<Interface | undefined> {
    if (ref.type === 'id') {
      return this.client
        .getInterface(ref)
        .then((r) => r.interface)
        .catch(this._returnUndefinedOnError('ResourceNotFound'))
    }
    return this.client
      .getInterfaceByName(ref)
      .then((r) => r.interface)
      .catch(this._returnUndefinedOnError('ResourceNotFound'))
  }

  public async testLogin(): Promise<void> {
    await this.client.listBots({})
  }

  public listAllPages = paging.listAllPages

  public async findPreviousIntegrationVersion(ref: NamePackageRef): Promise<Integration | undefined> {
    const previous = await findPreviousIntegrationVersion(this.client, ref)
    if (!previous) {
      return
    }
    return this.findIntegration({ type: 'id', id: previous.id })
  }

  public async findBotByName(name: string): Promise<BotSummary | undefined> {
    // api does not allow filtering bots by name
    const allBots = await this.listAllPages(this.client.listBots, (r) => r.bots)
    return allBots.find((b) => b.name === name)
  }

  private _returnUndefinedOnError =
    (type: client.ApiError['type']) =>
    (thrown: any): undefined => {
      if (client.isApiError(thrown) && thrown.type === type) {
        return
      }
      throw thrown
    }
}

import * as client from '@botpress/client'
import yn from 'yn'
import type { Logger } from '../logger'
import { formatPackageRef, ApiPackageRef, NamePackageRef } from '../package-ref'
import * as utils from '../utils'
import { findPreviousIntegrationVersion } from './find-previous-version'
import * as paging from './paging'

import {
  ApiClientProps,
  PublicIntegration,
  PrivateIntegration,
  PublicOrPrivateIntegration,
  PublicInterface,
  PrivateInterface,
  PublicOrPrivateInterface,
  PrivatePlugin,
  PublicPlugin,
  PublicOrPrivatePlugin,
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
  public readonly botId?: string

  public static newClient = (props: ApiClientProps, logger: Logger) => new ApiClient(props, logger)

  public constructor(
    props: ApiClientProps,
    private _logger: Logger
  ) {
    const { apiUrl, token, workspaceId, botId } = props
    this.client = new client.Client({ apiUrl, token, workspaceId, botId })
    this.url = apiUrl
    this.token = token
    this.workspaceId = workspaceId
    this.botId = botId
  }

  public get isBotpressWorkspace(): boolean {
    // this environment variable is undocumented and only used internally for dev purposes
    const isBotpressWorkspace = yn(process.env.BP_IS_BOTPRESS_WORKSPACE)
    if (isBotpressWorkspace !== undefined) {
      return isBotpressWorkspace
    }
    return [
      '6a76fa10-e150-4ff6-8f59-a300feec06c1',
      '95de33eb-1551-4af9-9088-e5dcb02efd09',
      '11111111-1111-1111-aaaa-111111111111',
    ].includes(this.workspaceId)
  }

  public async getWorkspace(): Promise<client.ClientOutputs['getWorkspace']> {
    return this.client.getWorkspace({ id: this.workspaceId })
  }

  public async findWorkspaceByHandle(handle: string): Promise<client.ClientOutputs['getWorkspace'] | undefined> {
    const { workspaces } = await this.client.listWorkspaces({ handle })
    return workspaces[0] // There should be only one workspace with a given handle
  }

  public switchWorkspace(workspaceId: string): ApiClient {
    return ApiClient.newClient({ apiUrl: this.url, token: this.token, workspaceId }, this._logger)
  }

  public switchBot(botId: string): ApiClient {
    return ApiClient.newClient(
      { apiUrl: this.url, token: this.token, botId, workspaceId: this.workspaceId },
      this._logger
    )
  }

  public async updateWorkspace(
    props: utils.types.SafeOmit<client.ClientInputs['updateWorkspace'], 'id'>
  ): Promise<client.ClientOutputs['updateWorkspace']> {
    return this.client.updateWorkspace({ id: this.workspaceId, ...props })
  }

  public async getPublicOrPrivateIntegration(ref: ApiPackageRef): Promise<PublicOrPrivateIntegration> {
    const integration = await this.findPublicOrPrivateIntegration(ref)
    if (!integration) {
      throw new Error(`Integration "${formatPackageRef(ref)}" not found`)
    }
    return integration
  }

  public async findPublicOrPrivateIntegration(ref: ApiPackageRef): Promise<PublicOrPrivateIntegration | undefined> {
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
        .then((r) => ({ ...r.integration, public: true }) as const)
        .catch(this._returnUndefinedOnError('ResourceNotFound'))
    }
    return this.client
      .getPublicIntegration(ref)
      .then((r) => ({ ...r.integration, public: true }) as const)
      .catch(this._returnUndefinedOnError('ResourceNotFound'))
  }

  public async findPublicOrPrivateInterface(ref: ApiPackageRef): Promise<PublicOrPrivateInterface | undefined> {
    const formatted = formatPackageRef(ref)

    const privateInterface = await this.findPrivateInterface(ref)
    if (privateInterface) {
      this._logger.debug(`Found interface "${formatted}" in workspace`)
      return privateInterface
    }

    const publicInterface = await this.findPublicInterface(ref)
    if (publicInterface) {
      this._logger.debug(`Found interface "${formatted}" in hub`)
      return publicInterface
    }

    return
  }

  public async findPrivateInterface(ref: ApiPackageRef): Promise<PrivateInterface | undefined> {
    const { workspaceId } = this
    if (ref.type === 'id') {
      return this.client
        .getInterface(ref)
        .then((r) => ({ ...r.interface, workspaceId }))
        .catch(this._returnUndefinedOnError('ResourceNotFound'))
    }
    return this.client
      .getInterfaceByName(ref)
      .then((r) => ({ ...r.interface, workspaceId }))
      .catch(this._returnUndefinedOnError('ResourceNotFound'))
  }

  public async getPublicInterface(ref: ApiPackageRef): Promise<PublicInterface> {
    const intrface = await this.findPublicInterface(ref)
    if (!intrface) {
      throw new Error(`Interface "${formatPackageRef(ref)}" not found`)
    }
    return intrface
  }

  public async findPublicInterface(ref: ApiPackageRef): Promise<PublicInterface | undefined> {
    if (ref.type === 'id') {
      return this.client
        .getPublicInterfaceById(ref)
        .then((r) => ({ ...r.interface, public: true }) as const)
        .catch(this._returnUndefinedOnError('ResourceNotFound'))
    }

    return this.client
      .getPublicInterface(ref)
      .then((r) => ({ ...r.interface, public: true }) as const)
      .catch(this._returnUndefinedOnError('ResourceNotFound'))
  }

  public async findPublicPlugin(ref: ApiPackageRef): Promise<PublicPlugin | undefined> {
    if (ref.type === 'id') {
      return this.client
        .getPublicPluginById(ref)
        .then((r) => ({ ...r.plugin, public: true }) as const)
        .catch(this._returnUndefinedOnError('ResourceNotFound'))
    }

    return this.client
      .getPublicPlugin(ref)
      .then((r) => ({ ...r.plugin, public: true }) as const)
      .catch(this._returnUndefinedOnError('ResourceNotFound'))
  }

  public async getPublicOrPrivatePlugin(ref: ApiPackageRef): Promise<PublicOrPrivatePlugin> {
    const plugin = await this.findPublicOrPrivatePlugin(ref)
    if (!plugin) {
      throw new Error(`Plugin "${formatPackageRef(ref)}" not found`)
    }
    return plugin
  }

  public async findPublicOrPrivatePlugin(ref: ApiPackageRef): Promise<PublicOrPrivatePlugin | undefined> {
    const formatted = formatPackageRef(ref)

    const privatePlugin = await this.findPrivatePlugin(ref)
    if (privatePlugin) {
      this._logger.debug(`Found plugin "${formatted}" in workspace`)
      return privatePlugin
    }

    const publicPlugin = await this.findPublicPlugin(ref)
    if (publicPlugin) {
      this._logger.debug(`Found plugin "${formatted}" in hub`)
      return publicPlugin
    }

    return
  }

  public async findPrivatePlugin(ref: ApiPackageRef): Promise<PrivatePlugin | undefined> {
    const { workspaceId } = this
    if (ref.type === 'id') {
      return this.client
        .getPlugin(ref)
        .then((r) => ({ ...r.plugin, workspaceId }))
        .catch(this._returnUndefinedOnError('ResourceNotFound'))
    }
    return this.client
      .getPluginByName(ref)
      .then((r) => ({ ...r.plugin, workspaceId }))
      .catch(this._returnUndefinedOnError('ResourceNotFound'))
  }

  public async testLogin(): Promise<void> {
    await this.client.listBots({})
  }

  public listAllPages = paging.listAllPages

  public async findPreviousIntegrationVersion(ref: NamePackageRef): Promise<PublicOrPrivateIntegration | undefined> {
    const previous = await findPreviousIntegrationVersion(this.client, ref)
    if (!previous) {
      return
    }
    return this.findPublicOrPrivateIntegration({ type: 'id', id: previous.id })
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

import chalk from 'chalk'
import _ from 'lodash'
import { ApiClient, PublicOrPrivateIntegration, IntegrationSummary } from 'src/api/client'
import type commandDefinitions from '../command-definitions'
import * as errors from '../errors'
import { NamePackageRef, parsePackageRef } from '../package-ref'
import { GlobalCommand } from './global-command'

export type GetIntegrationCommandDefinition = typeof commandDefinitions.integrations.subcommands.get
export class GetIntegrationCommand extends GlobalCommand<GetIntegrationCommandDefinition> {
  public async run(): Promise<void> {
    const api = await this.ensureLoginAndCreateClient(this.argv)
    const parsedRef = parsePackageRef(this.argv.integrationRef)
    if (!parsedRef) {
      throw new errors.InvalidPackageReferenceError(this.argv.integrationRef)
    }
    if (parsedRef.type === 'path') {
      throw new errors.BotpressCLIError('Cannot get local integration')
    }

    try {
      const integration = await api.findPublicOrPrivateIntegration(parsedRef)
      if (integration) {
        this.logger.success(`Integration ${chalk.bold(this.argv.integrationRef)}:`)
        this.logger.json(integration)
        return
      }
    } catch (thrown) {
      throw errors.BotpressCLIError.wrap(thrown, `Could not get integration ${this.argv.integrationRef}`)
    }

    throw new errors.BotpressCLIError(`Integration ${this.argv.integrationRef} not found`)
  }
}

export type ListIntegrationsCommandDefinition = typeof commandDefinitions.integrations.subcommands.list
export class ListIntegrationsCommand extends GlobalCommand<ListIntegrationsCommandDefinition> {
  public async run(): Promise<void> {
    const api = await this.ensureLoginAndCreateClient(this.argv)

    const { dev, public: isPublic, owned } = this.argv

    if (dev && isPublic) {
      throw new errors.BotpressCLIError(
        'Cannot use --dev and --public flags together as dev integrations are always private'
      )
    }
    if (dev && owned) {
      throw new errors.BotpressCLIError(
        'Cannot use --dev and --owned flags together as dev integrations are always owned by the current workspace'
      )
    }

    try {
      const integrations = await this._listAllIntegrations(api)
      this.logger.success('Integrations:')
      this.logger.json(integrations)
    } catch (thrown) {
      throw errors.BotpressCLIError.wrap(thrown, 'Could not list integrations')
    }
  }

  private _listAllIntegrations = async (api: ApiClient): Promise<IntegrationSummary[]> => {
    if (this.argv.dev) {
      return this._listDevIntegrations(api)
    }

    if (this.argv.public && this.argv.owned) {
      const [owned, publicIntegrations] = await Promise.all([
        this._listOwnedIntegrations(api),
        this._listPublicIntegrations(api),
      ])
      return _.intersectionBy(owned, publicIntegrations, (i) => i.id).slice(0, this.argv.limit)
    }

    if (this.argv.owned) {
      return this._listOwnedIntegrations(api)
    }

    if (this.argv.public) {
      return this._listPublicIntegrations(api)
    }

    const [owned, publicIntegrations] = await Promise.all([
      this._listOwnedIntegrations(api),
      this._listPublicIntegrations(api),
    ])
    return _.uniqBy([...owned, ...publicIntegrations], (i) => i.id).slice(0, this.argv.limit)
  }

  private _listDevIntegrations = async (api: ApiClient): Promise<IntegrationSummary[]> => {
    const { name, versionNumber: version } = this.argv
    return api.client.list.integrations({ dev: true, name, version }).collect({ limit: this.argv.limit })
  }

  private _listOwnedIntegrations = async (api: ApiClient): Promise<IntegrationSummary[]> => {
    const { name, versionNumber: version } = this.argv
    return api.client.list.integrations({ name, version }).collect({ limit: this.argv.limit })
  }

  private _listPublicIntegrations = async (api: ApiClient): Promise<IntegrationSummary[]> => {
    const { name, versionNumber: version } = this.argv
    return api.client.list.publicIntegrations({ name, version }).collect({ limit: this.argv.limit })
  }
}

export type DeleteIntegrationCommandDefinition = typeof commandDefinitions.integrations.subcommands.delete
export class DeleteIntegrationCommand extends GlobalCommand<DeleteIntegrationCommandDefinition> {
  public async run(): Promise<void> {
    const api = await this.ensureLoginAndCreateClient(this.argv)
    const parsedRef = parsePackageRef(this.argv.integrationRef)
    if (!parsedRef) {
      throw new errors.InvalidPackageReferenceError(this.argv.integrationRef)
    }
    if (parsedRef.type === 'path') {
      throw new errors.BotpressCLIError('Cannot delete local integration')
    }

    let integrationId: string | undefined
    if (parsedRef.type === 'id') {
      integrationId = parsedRef.id
    } else {
      const integration = await this._findIntegration(api, parsedRef)
      integrationId = integration.id
    }

    try {
      await api.client.deleteIntegration({ id: integrationId })
    } catch (thrown) {
      throw errors.BotpressCLIError.wrap(thrown, `Could not delete integration ${this.argv.integrationRef}`)
    }

    this.logger.success(`Integration ${chalk.bold(this.argv.integrationRef)} deleted`)
    return
  }

  private _findIntegration = async (api: ApiClient, parsedRef: NamePackageRef) => {
    let integration: PublicOrPrivateIntegration | undefined

    try {
      integration = await api.findPrivateIntegration(parsedRef)
    } catch (thrown) {
      throw errors.BotpressCLIError.wrap(thrown, `Could not get integration ${this.argv.integrationRef}`)
    }

    if (!integration) {
      const publicIntegration = await api.findPublicIntegration(parsedRef)
      if (publicIntegration) {
        throw new errors.BotpressCLIError(`Integration ${this.argv.integrationRef} does not belong to your workspace`)
      }

      throw new errors.BotpressCLIError(`Integration ${this.argv.integrationRef} not found`)
    }

    return integration
  }
}

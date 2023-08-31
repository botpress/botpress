import type * as bpclient from '@botpress/client'
import chalk from 'chalk'
import _ from 'lodash'
import type commandDefinitions from '../command-definitions'
import * as errors from '../errors'
import { parseIntegrationRef } from '../integration-ref'
import { GlobalCommand } from './global-command'

export type GetIntegrationCommandDefinition = typeof commandDefinitions.integrations.subcommands.get
export class GetIntegrationCommand extends GlobalCommand<GetIntegrationCommandDefinition> {
  public async run(): Promise<void> {
    const api = await this.ensureLoginAndCreateClient(this.argv)
    const parsedRef = parseIntegrationRef(this.argv.integrationRef)
    if (!parsedRef) {
      throw new errors.InvalidIntegrationReferenceError(this.argv.integrationRef)
    }
    if (parsedRef.type === 'path') {
      throw new errors.BotpressCLIError('Cannot get local integration')
    }

    try {
      const integration = await api.findIntegration(parsedRef)
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

    const privateLister = (req: { nextToken?: string }) =>
      api.client.listIntegrations({ nextToken: req.nextToken, name: this.argv.name, version: this.argv.version })

    const publicLister = (req: { nextToken?: string }) =>
      api.client.listPublicIntegrations({ nextToken: req.nextToken, name: this.argv.name, version: this.argv.version })

    try {
      const privateIntegrations = await api.listAllPages(privateLister, (r) => r.integrations)
      const publicIntegrations = await api.listAllPages(publicLister, (r) => r.integrations)
      const integrations = _.uniqBy([...privateIntegrations, ...publicIntegrations], (i) => i.id)

      this.logger.success('Integrations:')
      this.logger.json(integrations)
    } catch (thrown) {
      throw errors.BotpressCLIError.wrap(thrown, 'Could not list integrations')
    }
  }
}

export type DeleteIntegrationCommandDefinition = typeof commandDefinitions.integrations.subcommands.delete
export class DeleteIntegrationCommand extends GlobalCommand<DeleteIntegrationCommandDefinition> {
  public async run(): Promise<void> {
    const api = await this.ensureLoginAndCreateClient(this.argv)
    const parsedRef = parseIntegrationRef(this.argv.integrationRef)
    if (!parsedRef) {
      throw new errors.InvalidIntegrationReferenceError(this.argv.integrationRef)
    }
    if (parsedRef.type === 'path') {
      throw new errors.BotpressCLIError('Cannot delete local integration')
    }

    let integration: bpclient.Integration | undefined
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

    try {
      await api.client.deleteIntegration({ id: integration.id })
    } catch (thrown) {
      throw errors.BotpressCLIError.wrap(thrown, `Could not delete integration ${this.argv.integrationRef}`)
    }

    this.logger.success(`Integration ${chalk.bold(this.argv.integrationRef)} deleted`)
    return
  }
}

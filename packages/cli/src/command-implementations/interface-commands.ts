import type * as client from '@botpress/client'
import chalk from 'chalk'
import _ from 'lodash'
import type commandDefinitions from '../command-definitions'
import * as errors from '../errors'
import { parsePackageRef } from '../package-ref'
import { GlobalCommand } from './global-command'

export type GetInterfaceCommandDefinition = typeof commandDefinitions.interfaces.subcommands.get
export class GetInterfaceCommand extends GlobalCommand<GetInterfaceCommandDefinition> {
  public async run(): Promise<void> {
    const api = await this.ensureLoginAndCreateClient(this.argv)
    const parsedRef = parsePackageRef(this.argv.interfaceRef)
    if (!parsedRef) {
      throw new errors.InvalidPackageReferenceError(this.argv.interfaceRef)
    }
    if (parsedRef.type === 'path') {
      throw new errors.BotpressCLIError('Cannot get local interface')
    }

    try {
      const intrface = await api.findPublicOrPrivateInterface(parsedRef)
      if (intrface) {
        this.logger.success(`Interface ${chalk.bold(this.argv.interfaceRef)}:`)
        this.logger.json(intrface)
        return
      }
    } catch (thrown) {
      throw errors.BotpressCLIError.wrap(thrown, `Could not get interface ${this.argv.interfaceRef}`)
    }

    throw new errors.BotpressCLIError(`Interface ${this.argv.interfaceRef} not found`)
  }
}

export type ListInterfacesCommandDefinition = typeof commandDefinitions.interfaces.subcommands.list
export class ListInterfacesCommand extends GlobalCommand<ListInterfacesCommandDefinition> {
  public async run(): Promise<void> {
    const api = await this.ensureLoginAndCreateClient(this.argv)

    const privateLister = (req: { nextToken?: string }) => api.client.listInterfaces({ nextToken: req.nextToken })
    const publicLister = (req: { nextToken?: string }) => api.client.listPublicInterfaces({ nextToken: req.nextToken })

    try {
      const privateInterfaces = await api.listAllPages(privateLister, (r) => r.interfaces)
      const publicInterfaces = await api.listAllPages(publicLister, (r) => r.interfaces)
      const interfaces = _.uniqBy([...privateInterfaces, ...publicInterfaces], (i) => i.id)

      this.logger.success('Interfaces:')
      this.logger.json(interfaces)
    } catch (thrown) {
      throw errors.BotpressCLIError.wrap(thrown, 'Could not list interfaces')
    }
  }
}

export type DeleteInterfaceCommandDefinition = typeof commandDefinitions.interfaces.subcommands.delete
export class DeleteInterfaceCommand extends GlobalCommand<DeleteInterfaceCommandDefinition> {
  public async run(): Promise<void> {
    const api = await this.ensureLoginAndCreateClient(this.argv)
    const parsedRef = parsePackageRef(this.argv.interfaceRef)
    if (!parsedRef) {
      throw new errors.InvalidPackageReferenceError(this.argv.interfaceRef)
    }
    if (parsedRef.type === 'path') {
      throw new errors.BotpressCLIError('Cannot delete local interface')
    }

    let intrface: client.Interface | undefined
    try {
      intrface = await api.findPublicOrPrivateInterface(parsedRef)
    } catch (thrown) {
      throw errors.BotpressCLIError.wrap(thrown, `Could not get interface ${this.argv.interfaceRef}`)
    }

    if (!intrface) {
      throw new errors.BotpressCLIError(`Interface ${this.argv.interfaceRef} not found`)
    }

    try {
      await api.client.deleteInterface({ id: intrface.id })
    } catch (thrown) {
      throw errors.BotpressCLIError.wrap(thrown, `Could not delete interface ${this.argv.interfaceRef}`)
    }

    this.logger.success(`Interface ${chalk.bold(this.argv.interfaceRef)} deleted`)
    return
  }
}

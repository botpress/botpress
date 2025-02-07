import type * as client from '@botpress/client'
import chalk from 'chalk'
import type commandDefinitions from '../command-definitions'
import * as errors from '../errors'
import { parsePackageRef } from '../package-ref'
import { GlobalCommand } from './global-command'

export type GetPluginCommandDefinition = typeof commandDefinitions.plugins.subcommands.get
export class GetPluginCommand extends GlobalCommand<GetPluginCommandDefinition> {
  public async run(): Promise<void> {
    const api = await this.ensureLoginAndCreateClient(this.argv)
    const parsedRef = parsePackageRef(this.argv.pluginRef)
    if (!parsedRef) {
      throw new errors.InvalidPackageReferenceError(this.argv.pluginRef)
    }
    if (parsedRef.type === 'path') {
      throw new errors.BotpressCLIError('Cannot get local plugin')
    }

    try {
      const plugin = await api.findPublicPlugin(parsedRef)
      if (plugin) {
        this.logger.success(`Plugin ${chalk.bold(this.argv.pluginRef)}:`)
        this.logger.json(plugin)
        return
      }
    } catch (thrown) {
      throw errors.BotpressCLIError.wrap(thrown, `Could not get plugin ${this.argv.pluginRef}`)
    }

    throw new errors.BotpressCLIError(`Plugin ${this.argv.pluginRef} not found`)
  }
}

export type ListPluginsCommandDefinition = typeof commandDefinitions.plugins.subcommands.list
export class ListPluginsCommand extends GlobalCommand<ListPluginsCommandDefinition> {
  public async run(): Promise<void> {
    const api = await this.ensureLoginAndCreateClient(this.argv)

    const lister = (req: { nextToken?: string }) => api.client.listPlugins({ nextToken: req.nextToken })

    try {
      const plugins = await api.listAllPages(lister, (r) => r.plugins)

      this.logger.success('Plugins:')
      this.logger.json(plugins)
    } catch (thrown) {
      throw errors.BotpressCLIError.wrap(thrown, 'Could not list plugins')
    }
  }
}

export type DeletePluginCommandDefinition = typeof commandDefinitions.plugins.subcommands.delete
export class DeletePluginCommand extends GlobalCommand<DeletePluginCommandDefinition> {
  public async run(): Promise<void> {
    const api = await this.ensureLoginAndCreateClient(this.argv)
    const parsedRef = parsePackageRef(this.argv.pluginRef)
    if (!parsedRef) {
      throw new errors.InvalidPackageReferenceError(this.argv.pluginRef)
    }
    if (parsedRef.type === 'path') {
      throw new errors.BotpressCLIError('Cannot delete local plugin')
    }

    let plugin: client.Plugin | undefined
    try {
      plugin = await api.findPublicPlugin(parsedRef)
    } catch (thrown) {
      throw errors.BotpressCLIError.wrap(thrown, `Could not get plugin ${this.argv.pluginRef}`)
    }

    if (!plugin) {
      throw new errors.BotpressCLIError(`Plugin ${this.argv.pluginRef} not found`)
    }

    try {
      await api.client.deletePlugin({ id: plugin.id })
    } catch (thrown) {
      throw errors.BotpressCLIError.wrap(thrown, `Could not delete plugin ${this.argv.pluginRef}`)
    }

    this.logger.success(`Plugin ${chalk.bold(this.argv.pluginRef)} deleted`)
    return
  }
}

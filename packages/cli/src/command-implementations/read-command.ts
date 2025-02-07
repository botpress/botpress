import * as sdk from '@botpress/sdk'
import * as apiUtils from '../api'
import commandDefinitions from '../command-definitions'
import * as errors from '../errors'
import * as utils from '../utils'
import { ProjectCommand } from './project-command'

export type ReadCommandDefinition = typeof commandDefinitions.read
export class ReadCommand extends ProjectCommand<ReadCommandDefinition> {
  public async run(): Promise<void> {
    const projectDef = await this.readProjectDefinitionFromFS()
    if (projectDef.type === 'integration') {
      const parsed = await this._parseIntegration(projectDef.definition)
      this.logger.json(parsed)
      return
    }
    if (projectDef.type === 'interface') {
      const parsed = await this._parseInterface(projectDef.definition)
      this.logger.json(parsed)
      return
    }
    if (projectDef.type === 'bot') {
      const parsed = await this._parseBot(projectDef.definition)
      this.logger.json(parsed)
      return
    }
    if (projectDef.type === 'plugin') {
      const parsed = await this._parsePlugin(projectDef.definition)
      this.logger.json(parsed)
      return
    }

    type _assertion = utils.types.AssertNever<typeof projectDef>
    throw new errors.BotpressCLIError('Unsupported project type')
  }

  private _parseIntegration = async (integrationDef: sdk.IntegrationDefinition) => {
    const parsed = await apiUtils.prepareCreateIntegrationBody(integrationDef)
    parsed.interfaces = utils.records.mapValues(integrationDef.interfaces ?? {}, (iface) => ({
      ...iface,
      id: iface.id ?? '',
    }))
    return parsed
  }

  private _parseInterface = async (interfaceDef: sdk.InterfaceDefinition) => {
    return await apiUtils.prepareCreateInterfaceBody(interfaceDef)
  }

  private _parseBot = async (botDef: sdk.BotDefinition) => {
    return await apiUtils.prepareCreateBotBody(botDef)
  }

  private _parsePlugin = async (pluginDef: sdk.PluginDefinition) => {
    return await apiUtils.prepareCreatePluginBody(pluginDef)
  }
}

import { prepareCreateIntegrationBody } from '../api/integration-body'
import { prepareCreateInterfaceBody } from '../api/interface-body'
import type commandDefinitions from '../command-definitions'
import * as errors from '../errors'
import * as utils from '../utils'
import { ProjectCommand } from './project-command'

export type ReadCommandDefinition = typeof commandDefinitions.read
export class ReadCommand extends ProjectCommand<ReadCommandDefinition> {
  public async run(): Promise<void> {
    const projectDef = await this.readProjectDefinitionFromFS()
    if (projectDef.type === 'integration') {
      const parsed = prepareCreateIntegrationBody(projectDef.definition)
      parsed.interfaces = utils.records.mapValues(projectDef.definition.interfaces, (iface) => ({
        id: '...', // need to be logged in to get this id
        ...iface,
      }))
      this.logger.json(parsed)
      return
    }
    if (projectDef.type === 'interface') {
      const parsed = prepareCreateInterfaceBody(projectDef.definition)
      this.logger.json(parsed)
      return
    }

    throw new errors.BotpressCLIError('A bot project has no definition to read')
  }
}

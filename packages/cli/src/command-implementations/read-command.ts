import { prepareCreateIntegrationBody } from '../api/integration-body'
import { prepareCreateInterfaceBody } from '../api/interface-body'
import type commandDefinitions from '../command-definitions'
import * as errors from '../errors'
import { ProjectCommand } from './project-command'

export type ReadCommandDefinition = typeof commandDefinitions.read
export class ReadCommand extends ProjectCommand<ReadCommandDefinition> {
  public async run(): Promise<void> {
    const projectDef = await this.readProjectDefinitionFromFS()
    if (projectDef.type === 'integration') {
      const parsed = await prepareCreateIntegrationBody(projectDef.definition)
      // TODO: maybe display interface implementation statements here
      this.logger.json(parsed)
      return
    }
    if (projectDef.type === 'interface') {
      const parsed = await prepareCreateInterfaceBody(projectDef.definition)
      this.logger.json(parsed)
      return
    }

    throw new errors.BotpressCLIError('A bot project has no definition to read')
  }
}

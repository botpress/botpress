import { prepareCreateIntegrationBody } from '../api/integration-body'
import type commandDefinitions from '../command-definitions'
import * as errors from '../errors'
import { ProjectCommand } from './project-command'

export type ReadCommandDefinition = typeof commandDefinitions.read
export class ReadCommand extends ProjectCommand<ReadCommandDefinition> {
  public async run(): Promise<void> {
    const projectDef = await this.readProjectDefinitionFromFS()
    if (projectDef.type === 'bot') {
      throw new errors.BotpressCLIError('A bot project has no definition to read')
    }
    if (projectDef.type === 'interface') {
      // TODO: implement read for interface projects
      throw new errors.BotpressCLIError('Cannot read an interface project yet.')
    }
    const parsed = prepareCreateIntegrationBody(projectDef.definition)
    this.logger.json(parsed)
  }
}

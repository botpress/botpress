import { prepareCreateIntegrationBody } from '../api/integration-body'
import type commandDefinitions from '../command-definitions'
import * as errors from '../errors'
import { ProjectCommand } from './project-command'

export type ReadCommandDefinition = typeof commandDefinitions.read
export class ReadCommand extends ProjectCommand<ReadCommandDefinition> {
  public async run(): Promise<void> {
    const integrationDef = await this.readIntegrationDefinitionFromFS()
    if (!integrationDef) {
      throw new errors.ExclusiveIntegrationFeatureError()
    }
    const parsed = prepareCreateIntegrationBody(integrationDef)
    this.logger.json(parsed)
  }
}

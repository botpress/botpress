import { IntegrationDefinition } from '@botpress/sdk'
import { prepareCreateIntegrationBody } from '../api/integration-body'
import type commandDefinitions from '../command-definitions'
import * as errors from '../errors'
import { IntegrationLinter } from '../linter/integration-linter'
import { ProjectCommand } from './project-command'

export type LintCommandDefinition = typeof commandDefinitions.lint
export class LintCommand extends ProjectCommand<LintCommandDefinition> {
  public async run(): Promise<void> {
    const projectDef = await this.readProjectDefinitionFromFS()

    switch (projectDef.type) {
      case 'integration':
        return this.runLintForIntegration(projectDef.definition)
      case 'bot':
        throw new errors.BotpressCLIError('Bot linting is not yet implemented')
      case 'interface':
        throw new errors.BotpressCLIError('Interface linting is not yet implemented')
      default:
        throw new errors.BotpressCLIError('Unsupported project type')
    }
  }

  private async runLintForIntegration(definition: IntegrationDefinition): Promise<void> {
    const parsedIntegrationDefinition = prepareCreateIntegrationBody(definition)
    const linter = new IntegrationLinter(parsedIntegrationDefinition)

    await linter.lint()
    linter.logResults(this.logger)
  }
}

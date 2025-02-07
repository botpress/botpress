import * as sdk from '@botpress/sdk'
import chalk from 'chalk'
import fslib from 'fs'
import pathlib from 'path'
import * as codegen from '../code-generation'
import type commandDefinitions from '../command-definitions'
import * as errors from '../errors'
import * as utils from '../utils'
import { ProjectCommand } from './project-command'

export type GenerateCommandDefinition = typeof commandDefinitions.generate
export class GenerateCommand extends ProjectCommand<GenerateCommandDefinition> {
  public async run(): Promise<void> {
    const projectDef = await this.readProjectDefinitionFromFS()
    if (projectDef.type === 'interface') {
      this.logger.success('Interface projects have no code to generate since they have no implementation.')
      return
    }
    if (projectDef.type === 'integration') {
      return await this._generateIntegration(projectDef.definition)
    }
    if (projectDef.type === 'bot') {
      return await this._generateBot(projectDef.definition)
    }
    if (projectDef.type === 'plugin') {
      return await this._generatePlugin(projectDef.definition)
    }
    throw new errors.UnsupportedProjectType()
  }

  private async _generateIntegration(integrationDef: sdk.IntegrationDefinition): Promise<void> {
    this._validateSecrets(integrationDef)

    const line = this.logger.line()

    const { name } = integrationDef
    line.started(`Generating typings for integration ${chalk.bold(name)}...`)

    const fromWorkDir = this.projectPaths.rel('workDir')

    const generatedFiles = await codegen.generateIntegrationImplementation(integrationDef)

    await this._writeGeneratedFilesToOutFolder(generatedFiles)

    line.success(`Typings available at ${chalk.grey(fromWorkDir.outDir)}`)
  }

  private async _generateBot(botDefinition: sdk.BotDefinition): Promise<void> {
    const line = this.logger.line()

    line.started('Generating typings for bot...')

    const fromWorkDir = this.projectPaths.rel('workDir')

    const generatedFiles = await codegen.generateBotImplementation(botDefinition)

    await this._writeGeneratedFilesToOutFolder(generatedFiles)

    line.success(`Typings available at ${chalk.grey(fromWorkDir.outDir)}`)
  }

  private async _generatePlugin(pluginDefinition: sdk.PluginDefinition): Promise<void> {
    const line = this.logger.line()

    const { name } = pluginDefinition
    line.started(`Generating typings for plugin ${chalk.bold(name)}...`)

    const fromWorkDir = this.projectPaths.rel('workDir')

    const generatedFiles = await codegen.generatePluginImplementation(pluginDefinition)

    await this._writeGeneratedFilesToOutFolder(generatedFiles)

    line.success(`Typings available at ${chalk.grey(fromWorkDir.outDir)}`)
  }

  private async _writeGeneratedFilesToOutFolder(files: codegen.File[]) {
    for (const file of files) {
      const filePath = utils.path.absoluteFrom(this.projectPaths.abs.outDir, file.path)
      const dirPath = pathlib.dirname(filePath)
      await fslib.promises.mkdir(dirPath, { recursive: true })
      await fslib.promises.writeFile(filePath, file.content)
    }
  }

  private _validateSecrets(integrationDef: sdk.IntegrationDefinition): void {
    const { secrets } = integrationDef
    if (!secrets) {
      return
    }

    for (const secretName in secrets) {
      if (!utils.casing.is.screamingSnakeCase(secretName)) {
        throw new errors.BotpressCLIError(`Secret ${secretName} should be in SCREAMING_SNAKE_CASE`)
      }
    }
  }
}

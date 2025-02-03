import type { Bot as BotImpl, Integration as IntegrationImpl } from '@botpress/sdk'
import * as fs from 'fs'
import type commandDefinitions from '../command-definitions'
import * as errors from '../errors'
import * as utils from '../utils'
import { ProjectCommand } from './project-command'

type Serveable = BotImpl | IntegrationImpl

export type ServeCommandDefinition = typeof commandDefinitions.serve
export class ServeCommand extends ProjectCommand<ServeCommandDefinition> {
  public async run(): Promise<void> {
    const outfile = this.projectPaths.abs.outFileCJS
    if (!fs.existsSync(outfile)) {
      throw new errors.NoBundleFoundError()
    }

    const projectDef = await this.readProjectDefinitionFromFS()
    if (projectDef.type === 'interface') {
      throw new errors.BotpressCLIError('An interface project has no implementation to serve.')
    }

    if (projectDef.type === 'integration') {
      // TODO: store secrets in local cache to avoid prompting every time
      const secretEnvVariables = await this.promptSecrets(projectDef.definition, this.argv, { formatEnv: true })
      const nonNullSecretEnvVariables = utils.records.filterValues(secretEnvVariables, utils.guards.is.notNull)
      for (const [key, value] of Object.entries(nonNullSecretEnvVariables)) {
        process.env[key] = value
      }
    }

    this.logger.log(`Serving ${projectDef.type}...`)

    const { default: serveable } = utils.require.requireJsFile<{ default: Serveable }>(outfile)
    const server = await serveable.start(this.argv.port)

    await new Promise<void>((resolve, reject) => {
      server.on('error', reject)
      server.on('close', resolve)
    })
  }
}

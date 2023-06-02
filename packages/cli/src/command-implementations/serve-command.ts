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
    const outfile = this.projectPaths.abs.outFile
    if (!fs.existsSync(outfile)) {
      throw new errors.NoBundleFoundError()
    }

    const integrationDef = await this.readIntegrationDefinitionFromFS()
    if (integrationDef) {
      const secrets = await this.promptSecrets(integrationDef, this.argv)
      for (const [key, value] of Object.entries(secrets)) {
        process.env[key] = value
      }
    }

    this.logger.log(`Serving ${integrationDef ? 'integration' : 'bot'}...`)

    const { default: serveable } = utils.require.requireJsFile<{ default: Serveable }>(outfile)
    const server = await serveable.start(this.argv.port)

    await new Promise<void>((resolve, reject) => {
      server.on('error', reject)
      server.on('close', resolve)
    })
  }
}

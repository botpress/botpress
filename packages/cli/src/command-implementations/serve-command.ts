import type * as sdk from '@botpress/sdk'
import type { Bot as BotImpl, Integration as IntegrationImpl } from '@botpress/sdk'
import { spawn } from 'child_process'
import * as fs from 'fs'
import * as pathlib from 'path'
import type commandDefinitions from '../command-definitions'
import * as errors from '../errors'
import * as utils from '../utils'
import { ProjectCommand } from './project-command'

type Serveable = BotImpl | IntegrationImpl

export type ServeCommandDefinition = typeof commandDefinitions.serve
export class ServeCommand extends ProjectCommand<ServeCommandDefinition> {
  public async run(): Promise<void> {
    const { projectType, resolveProjectDefinition } = this.readProjectDefinitionFromFS()
    if (projectType === 'interface') {
      throw new errors.BotpressCLIError('An interface project has no implementation to serve.')
    }
    if (this.argv.setupEnv && projectType !== 'integration') {
      throw new errors.BotpressCLIError('--setupEnv is only supported for integration projects.')
    }

    if (projectType === 'integration' || projectType === 'bot') {
      const projectDef = await resolveProjectDefinition()
      // TODO: store secrets in local cache to avoid prompting every time
      const secretEnvVariables = await this.promptSecrets(projectDef.definition, this.argv, {
        formatEnv: true,
      })
      const nonNullSecretEnvVariables = utils.records.filterValues(secretEnvVariables, utils.guards.is.notNull)
      for (const [key, value] of Object.entries(nonNullSecretEnvVariables)) {
        process.env[key] = value
      }
      if (this.argv.setupEnv && projectDef.type === 'integration') {
        await this._setupEnvForLocalServe(projectDef.definition)
      }
    }

    if (this.argv.entry) {
      await this._runEntryScript(this.argv.entry)
      return
    }

    const outfile = this.projectPaths.abs.outFileCJS
    if (!fs.existsSync(outfile)) {
      throw new errors.NoBundleFoundError()
    }

    this.logger.log(`Serving ${projectType}...`)

    const { default: serveable } = utils.require.requireJsFile<{ default: Serveable }>(outfile)
    const server = await serveable.start(this.argv.port)

    await new Promise<void>((resolve, reject) => {
      server.on('error', reject)
      server.on('close', resolve)
    })
  }

  private async _setupEnvForLocalServe(definition: sdk.IntegrationDefinition): Promise<void> {
    const api = await this.ensureLoginAndCreateClient(this.argv)
    const integration = await api.findPublicOrPrivateIntegration({
      type: 'name',
      name: definition.name,
      version: definition.version,
    })
    if (!integration) {
      throw new errors.BotpressCLIError(
        `Integration "${definition.name}@${definition.version}" not found. Run \`bp deploy\` first.`
      )
    }

    const { value: iak } = await api.client.createIntegrationApiKey({
      integrationId: integration.id,
      note: `local serve - ${new Date().toISOString()}`,
    })

    process.env.BP_API_URL = api.url
    process.env.BP_TOKEN = iak
    process.env.BP_WORKSPACE_ID = api.workspaceId

    this.logger.debug(`Env configured with BP_API_URL=${api.url} BP_WORKSPACE_ID=${api.workspaceId} BP_TOKEN=<iak>`)
  }

  private async _runEntryScript(entry: string): Promise<void> {
    if (this.argv.port !== undefined) {
      process.env.PORT = String(this.argv.port)
    }
    const entryPath = pathlib.resolve(this.argv.workDir, entry)
    if (!fs.existsSync(entryPath)) {
      throw new errors.BotpressCLIError(`Entry file not found: ${entryPath}`)
    }

    this.logger.log(`Serving via entry script ${entryPath}...`)
    const child = spawn('node', [entryPath], { env: process.env, stdio: 'inherit' })

    process.on('SIGTERM', () => child.kill('SIGTERM'))
    process.on('SIGINT', () => child.kill('SIGINT'))

    await new Promise<void>((resolve, reject) => {
      child.on('error', reject)
      child.on('close', (code) => {
        if (code === 0 || code === null) resolve()
        else reject(new Error(`Entry script exited with code ${code}`))
      })
    })
  }
}

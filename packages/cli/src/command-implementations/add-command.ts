import type * as bpclient from '@botpress/client'
import type * as bpsdk from '@botpress/sdk'
import bluebird from 'bluebird'
import chalk from 'chalk'
import * as fs from 'fs'
import * as pathlib from 'path'
import * as codegen from '../code-generation'
import type commandDefinitions from '../command-definitions'
import * as consts from '../consts'
import * as errors from '../errors'
import {
  ApiIntegrationRef,
  formatIntegrationRef,
  LocalPathIntegrationRef,
  parseIntegrationRef,
} from '../integration-ref'
import * as utils from '../utils'
import { ProjectCommand } from './project-command'

type IntegrationInstallDir = codegen.IntegrationInstanceJson & {
  dirname: string
}

export type AddCommandDefinition = typeof commandDefinitions.add
export class AddCommand extends ProjectCommand<AddCommandDefinition> {
  public async run(): Promise<void> {
    const integrationDef = await this.readIntegrationDefinitionFromFS()
    if (integrationDef) {
      throw new errors.ExclusiveBotFeatureError()
    }

    const integrationRef = this.argv.integrationRef

    const parsedRef = parseIntegrationRef(integrationRef)
    if (!parsedRef) {
      throw new errors.InvalidIntegrationReferenceError(integrationRef)
    }

    const integration =
      parsedRef.type === 'path'
        ? await this._fetchLocalIntegration(parsedRef)
        : await this._fetchApiIntegration(parsedRef)

    const allInstances = await this._listIntegrationInstances()
    const existingInstance = allInstances.find((i) => i.name === integration.name)
    if (existingInstance) {
      this.logger.warn(`Integration with name "${integration.name}" already installed.`)
      const res = await this.prompt.confirm('Do you want to overwrite the existing instance?')
      if (!res) {
        this.logger.log('Aborted')
        return
      }

      await this._uninstallIntegration(existingInstance)
    }

    await this._generateIntegrationInstance(integration)
  }

  private _fetchLocalIntegration = async (
    integrationRef: LocalPathIntegrationRef
  ): Promise<bpsdk.IntegrationDefinition> => {
    this.logger.warn(
      'Installing integration from a local path. There is no guarantee that the integration is deployed with the expected schemas.'
    )

    const workDir = integrationRef.path
    const pathStore = new utils.path.PathStore<'workDir' | 'definition'>({
      workDir,
      definition: utils.path.absoluteFrom(workDir, consts.fromWorkDir.definition),
    })
    const integrationDefinition = await this.readIntegrationDefinitionFromFS(pathStore)
    if (!integrationDefinition) {
      throw new errors.BotpressCLIError(`Integration definition not found at ${workDir}`)
    }
    return integrationDefinition
  }

  private _fetchApiIntegration = async (integrationRef: ApiIntegrationRef): Promise<bpclient.Integration> => {
    const api = await this.ensureLoginAndCreateClient(this.argv)
    const integration = await api.findIntegration(integrationRef)
    if (!integration) {
      const formattedRef = formatIntegrationRef(integrationRef)
      throw new errors.BotpressCLIError(`Integration "${formattedRef}" not found`)
    }
    return integration
  }

  private async _listIntegrationInstances(): Promise<IntegrationInstallDir[]> {
    const installPath = this.projectPaths.abs.installDir
    if (!fs.existsSync(installPath)) {
      this.logger.debug('Install path does not exist. Skipping listing of integration instances')
      return []
    }

    const allFiles = await fs.promises.readdir(installPath)
    const allPaths = allFiles.map((name) => pathlib.join(installPath, name))
    const directories = await bluebird.filter(allPaths, async (path) => {
      const stat = await fs.promises.stat(path)
      return stat.isDirectory()
    })

    let jsons = directories.map((root) => ({ root, json: pathlib.join(root, codegen.INTEGRATION_JSON) }))
    jsons = jsons.filter(({ json: x }) => fs.existsSync(x))

    return bluebird.map(jsons, async ({ root, json }) => {
      const content: string = await fs.promises.readFile(json, 'utf-8')
      const { name, version, id } = JSON.parse(content) as codegen.IntegrationInstanceJson
      const dirname = pathlib.basename(root)
      return {
        dirname,
        id,
        name,
        version,
      }
    })
  }

  private async _uninstallIntegration(instance: IntegrationInstallDir) {
    const installDir = this.projectPaths.abs.installDir
    const instancePath = pathlib.join(installDir, instance.dirname)
    await fs.promises.rm(instancePath, { recursive: true })
    await this._generateBotIndex()
  }

  private async _generateIntegrationInstance(integration: bpclient.Integration | bpsdk.IntegrationDefinition) {
    const line = this.logger.line()

    const { name, version } = integration
    line.started(`Installing ${chalk.bold(name)} v${version}...`)

    const instanceFiles = await codegen.generateIntegrationInstance(
      integration,
      this.projectPaths.rel('outDir').installDir
    )
    await this.writeGeneratedFilesToOutFolder(instanceFiles)
    await this._generateBotIndex()

    const rel = this.projectPaths.rel('workDir')
    line.success(`Installed integration available at ${chalk.grey(rel.outDir)}`)
  }

  private async _generateBotIndex() {
    const allInstances = await this._listIntegrationInstances()
    const indexFile = await codegen.generateBotIndex(
      this.projectPaths.rel('outDir').installDir,
      allInstances.map((i) => i.dirname)
    )
    await this.writeGeneratedFilesToOutFolder([indexFile])
  }
}

import type * as client from '@botpress/client'
import type * as sdk from '@botpress/sdk'
import type { YargsConfig } from '@bpinternal/yargs-extra'
import bluebird from 'bluebird'
import chalk from 'chalk'
import fs from 'fs'
import _ from 'lodash'
import semver from 'semver'
import { ApiClient } from '../api/client'
import * as codegen from '../code-generation'
import type * as config from '../config'
import * as consts from '../consts'
import * as errors from '../errors'
import { formatPackageRef, PackageRef } from '../package-ref'
import { validateIntegrationDefinition, resolveInterfaces, resolveBotInterfaces } from '../sdk'
import type { CommandArgv, CommandDefinition } from '../typings'
import * as utils from '../utils'
import { GlobalCommand } from './global-command'

export type ProjectCommandDefinition = CommandDefinition<typeof config.schemas.project>
export type ProjectCache = { botId: string; devId: string }

type ConfigurableProjectPaths = { workDir: string }
type ConstantProjectPaths = typeof consts.fromWorkDir
type AllProjectPaths = ConfigurableProjectPaths & ConstantProjectPaths

type IntegrationInstance = NonNullable<sdk.PluginDefinition['integrations']>[string]
type RemoteIntegrationInstance = utils.types.Merge<IntegrationInstance, { id: string }>
type LocalIntegrationInstance = utils.types.Merge<IntegrationInstance, { uri?: string }>
type BotIntegrationRequest = NonNullable<NonNullable<client.ClientInputs['updateBot']['integrations']>[string]>

type LintIgnoredConfig = { bpLintDisabled?: boolean }

export type ProjectType = ProjectDefinition['type']
export type ProjectDefinition = LintIgnoredConfig &
  (
    | { type: 'integration'; definition: sdk.IntegrationDefinition }
    | { type: 'interface'; definition: sdk.InterfaceDeclaration }
    | { type: 'bot'; definition: sdk.BotDefinition }
    | { type: 'plugin'; definition: sdk.PluginDefinition }
  )

class ProjectPaths extends utils.path.PathStore<keyof AllProjectPaths> {
  public constructor(argv: CommandArgv<ProjectCommandDefinition>) {
    const absWorkDir = utils.path.absoluteFrom(utils.path.cwd(), argv.workDir)
    super({
      workDir: absWorkDir,
      ..._.mapValues(consts.fromWorkDir, (p) => utils.path.absoluteFrom(absWorkDir, p)),
    })
  }
}

export abstract class ProjectCommand<C extends ProjectCommandDefinition> extends GlobalCommand<C> {
  protected override async bootstrap() {
    await super.bootstrap()
    await this._notifyUpdateSdk()
  }

  protected get projectPaths() {
    return new ProjectPaths(this.argv)
  }

  protected get projectCache() {
    return new utils.cache.FSKeyValueCache<ProjectCache>(this.projectPaths.abs.projectCacheFile)
  }

  protected async fetchBotIntegrationInstances(
    botDefinition: sdk.BotDefinition,
    api: ApiClient
  ): Promise<Record<string, BotIntegrationRequest>> {
    const integrationList = _(botDefinition.integrations).values().filter(utils.guards.is.defined).value()

    const { remoteInstances, localInstances } = this._splitApiAndLocalIntegrationInstances(integrationList)

    const fetchedInstances: RemoteIntegrationInstance[] = await bluebird.map(localInstances, async (instance) => {
      const ref: PackageRef = { type: 'name', name: instance.definition.name, version: instance.definition.version }
      const integration = await api.findIntegration(ref)
      if (!integration) {
        const formattedRef = formatPackageRef(ref)
        throw new errors.BotpressCLIError(`Integration "${formattedRef}" not found`)
      }
      return { ...instance, id: integration.id }
    })

    return _([...fetchedInstances, ...remoteInstances])
      .keyBy((i) => i.id)
      .mapValues(({ enabled, configurationType, configuration }) => ({
        enabled,
        configurationType: configurationType ?? null,
        configuration,
      }))
      .value()
  }

  private _splitApiAndLocalIntegrationInstances(instances: IntegrationInstance[]): {
    remoteInstances: RemoteIntegrationInstance[]
    localInstances: LocalIntegrationInstance[]
  } {
    const remoteInstances: RemoteIntegrationInstance[] = []
    const localInstances: LocalIntegrationInstance[] = []
    for (const instance of instances) {
      if ('id' in instance) {
        remoteInstances.push(instance)
      } else {
        localInstances.push(instance)
      }
    }

    return { remoteInstances, localInstances }
  }

  protected async readProjectDefinitionFromFS(): Promise<ProjectDefinition> {
    const projectPaths = this.projectPaths
    try {
      const integrationDefinition = await this._readIntegrationDefinitionFromFS(projectPaths)
      if (integrationDefinition) {
        return { type: 'integration', ...integrationDefinition }
      }
      const interfaceDefinition = await this._readInterfaceDefinitionFromFS(projectPaths)
      if (interfaceDefinition) {
        return { type: 'interface', ...interfaceDefinition }
      }
      const botDefinition = await this._readBotDefinitionFromFS(projectPaths)
      if (botDefinition) {
        return { type: 'bot', ...botDefinition }
      }
      const pluginDefinition = await this._readPluginDefinitionFromFS(projectPaths)
      if (pluginDefinition) {
        return { type: 'plugin', ...pluginDefinition }
      }
    } catch (thrown: unknown) {
      throw errors.BotpressCLIError.wrap(thrown, 'Error while reading project definition')
    }

    throw new errors.ProjectDefinitionNotFoundError(this.projectPaths.abs.workDir)
  }

  private async _readIntegrationDefinitionFromFS(
    projectPaths: utils.path.PathStore<'workDir' | 'integrationDefinition'>
  ): Promise<({ definition: sdk.IntegrationDefinition } & LintIgnoredConfig) | undefined> {
    const abs = projectPaths.abs
    const rel = projectPaths.rel('workDir')

    if (!fs.existsSync(abs.integrationDefinition)) {
      return
    }

    const bpLintDisabled = await this._isBpLintDisabled(abs.integrationDefinition)

    const { outputFiles } = await utils.esbuild.buildEntrypoint({
      cwd: abs.workDir,
      outfile: '',
      entrypoint: rel.integrationDefinition,
      write: false,
      minify: false,
    })

    const artifact = outputFiles[0]
    if (!artifact) {
      throw new errors.BotpressCLIError('Could not read integration definition')
    }

    let { default: definition } = utils.require.requireJsCode<{ default: sdk.IntegrationDefinition }>(artifact.text)
    definition = resolveInterfaces(definition)
    validateIntegrationDefinition(definition)
    return { definition, bpLintDisabled }
  }

  private async _readInterfaceDefinitionFromFS(
    projectPaths: utils.path.PathStore<'workDir' | 'interfaceDefinition'>
  ): Promise<({ definition: sdk.InterfaceDeclaration } & LintIgnoredConfig) | undefined> {
    const abs = projectPaths.abs
    const rel = projectPaths.rel('workDir')

    if (!fs.existsSync(abs.interfaceDefinition)) {
      return
    }

    const bpLintDisabled = await this._isBpLintDisabled(abs.interfaceDefinition)

    const { outputFiles } = await utils.esbuild.buildEntrypoint({
      cwd: abs.workDir,
      outfile: '',
      entrypoint: rel.interfaceDefinition,
      write: false,
      minify: false,
    })

    const artifact = outputFiles[0]
    if (!artifact) {
      throw new errors.BotpressCLIError('Could not read interface definition')
    }

    const { default: definition } = utils.require.requireJsCode<{ default: sdk.InterfaceDeclaration }>(artifact.text)

    return { definition, bpLintDisabled }
  }

  private async _readBotDefinitionFromFS(
    projectPaths: utils.path.PathStore<'workDir' | 'botDefinition'>
  ): Promise<({ definition: sdk.BotDefinition } & LintIgnoredConfig) | undefined> {
    const abs = projectPaths.abs
    const rel = projectPaths.rel('workDir')

    if (!fs.existsSync(abs.botDefinition)) {
      return
    }

    const bpLintDisabled = await this._isBpLintDisabled(abs.botDefinition)

    const { outputFiles } = await utils.esbuild.buildEntrypoint({
      cwd: abs.workDir,
      outfile: '',
      entrypoint: rel.botDefinition,
      write: false,
      minify: false,
    })

    const artifact = outputFiles[0]
    if (!artifact) {
      throw new errors.BotpressCLIError('Could not read bot definition')
    }

    let { default: definition } = utils.require.requireJsCode<{ default: sdk.BotDefinition }>(artifact.text)
    // TODO: validate bot definition

    definition = resolveBotInterfaces(definition)
    return { definition, bpLintDisabled }
  }

  private async _readPluginDefinitionFromFS(
    projectPaths: utils.path.PathStore<'workDir' | 'pluginDefinition'>
  ): Promise<({ definition: sdk.PluginDefinition } & LintIgnoredConfig) | undefined> {
    const abs = projectPaths.abs
    const rel = projectPaths.rel('workDir')

    if (!fs.existsSync(abs.pluginDefinition)) {
      return
    }

    const bpLintDisabled = await this._isBpLintDisabled(abs.pluginDefinition)

    const { outputFiles } = await utils.esbuild.buildEntrypoint({
      cwd: abs.workDir,
      outfile: '',
      entrypoint: rel.pluginDefinition,
      write: false,
      minify: false,
    })

    const artifact = outputFiles[0]
    if (!artifact) {
      throw new errors.BotpressCLIError('Could not read plugin definition')
    }

    const { default: definition } = utils.require.requireJsCode<{ default: sdk.PluginDefinition }>(artifact.text)

    return { definition, bpLintDisabled }
  }

  private async _isBpLintDisabled(definitionPath: string): Promise<boolean> {
    const tsContent = await fs.promises.readFile(definitionPath, 'utf-8')
    const regex = /\/\* bplint-disable \*\//
    return regex.test(tsContent)
  }

  protected displayWebhookUrls(bot: client.Bot) {
    if (!_.keys(bot.integrations).length) {
      this.logger.debug('No integrations in bot')
      return
    }

    this.logger.log('Integrations:')
    for (const integration of Object.values(bot.integrations).filter(utils.guards.is.defined)) {
      if (!integration.enabled) {
        this.logger.log(`${chalk.grey(integration.name)} ${chalk.italic('(disabled)')}: ${integration.webhookUrl}`, {
          prefix: { symbol: '○', indent: 2 },
        })
      } else {
        this.logger.log(`${chalk.bold(integration.name)} : ${integration.webhookUrl}`, {
          prefix: { symbol: '●', indent: 2 },
        })
      }
    }
  }

  protected async promptSecrets(
    integrationDef: sdk.IntegrationDefinition,
    argv: YargsConfig<typeof config.schemas.secrets>,
    opts: { formatEnv?: boolean; knownSecrets?: string[] } = {}
  ): Promise<Record<string, string | null>> {
    const formatEnv = opts.formatEnv ?? false
    const knownSecrets = opts.knownSecrets ?? []

    const { secrets: secretDefinitions } = integrationDef
    if (!secretDefinitions) {
      return {}
    }

    const secretArgv = this._parseArgvSecrets(argv.secrets)
    const invalidSecret = Object.keys(secretArgv).find((s) => !secretDefinitions[s])
    if (invalidSecret) {
      throw new errors.BotpressCLIError(`Secret ${invalidSecret} is not defined in integration definition`)
    }

    const values: Record<string, string | null> = {}
    for (const [secretName, { optional }] of Object.entries(secretDefinitions)) {
      const argvSecret = secretArgv[secretName]
      if (argvSecret) {
        this.logger.debug(`Using secret "${secretName}" from argv`)
        values[secretName] = argvSecret
        continue
      }

      const alreadyKnown = knownSecrets.includes(secretName)
      let mode: string
      if (alreadyKnown) {
        mode = 'already set'
      } else if (optional) {
        mode = 'optional'
      } else {
        mode = 'required'
      }

      const prompted = await this.prompt.text(`Enter value for secret "${secretName}" (${mode})`)
      if (prompted) {
        values[secretName] = prompted
        continue
      }

      if (alreadyKnown) {
        this.logger.log(`Secret "${secretName}" is unchanged`)
      } else if (optional) {
        this.logger.warn(`Secret "${secretName}" is unassigned`)
      } else {
        throw new errors.BotpressCLIError(`Secret "${secretName}" is required`)
      }
    }

    for (const secretName of knownSecrets) {
      const isDefined = secretName in secretDefinitions
      if (isDefined) {
        continue
      }
      const prompted = await this.prompt.confirm(`Secret "${secretName}" was removed. Do you wish to delete it?`)
      if (prompted) {
        this.logger.log(`Deleting secret "${secretName}"`, { prefix: { symbol: '×', fg: 'red' } })
        values[secretName] = null
      }
    }

    if (!formatEnv) {
      return values
    }

    const envVariables = _.mapKeys(values, (_v, k) => codegen.secretEnvVariableName(k))
    return envVariables
  }

  protected async readIntegrationConfigDefinition<C extends client.ClientInputs['createIntegration']['configuration']>(
    config: C
  ): Promise<C> {
    if (!config?.identifier) {
      return config
    }
    return {
      ...config,
      identifier: {
        ...config.identifier,
        linkTemplateScript: await this.readProjectFile(config.identifier.linkTemplateScript),
      },
    }
  }

  protected readProjectFile = async (filePath: string | undefined): Promise<string | undefined> => {
    if (!filePath) {
      return undefined
    }
    const absoluteFilePath = utils.path.absoluteFrom(this.projectPaths.abs.workDir, filePath)
    return fs.promises.readFile(absoluteFilePath, 'utf-8').catch((thrown) => {
      throw errors.BotpressCLIError.wrap(thrown, `Could not read file "${absoluteFilePath}"`)
    })
  }

  private _parseArgvSecrets(argvSecrets: string[]): Record<string, string> {
    const parsed: Record<string, string> = {}
    for (const secret of argvSecrets) {
      const [key, value] = utils.string.splitOnce(secret, '=')
      if (!value) {
        throw new errors.BotpressCLIError(
          `Secret "${key}" is missing a value. Expected format: "SECRET_NAME=secretValue"`
        )
      }
      parsed[key!] = value
    }

    return parsed
  }

  private _notifyUpdateSdk = async (): Promise<void> => {
    try {
      this.logger.debug('Checking if sdk is up to date')

      const { workDir } = this.projectPaths.abs
      const projectPkgJson = await utils.pkgJson.readPackageJson(workDir)
      if (!projectPkgJson) {
        this.logger.debug(`Could not find package.json at "${workDir}"`)
        return
      }

      const sdkPackageName = '@botpress/sdk'
      const actualSdkVersion = utils.pkgJson.findDependency(projectPkgJson, sdkPackageName)
      if (!actualSdkVersion) {
        this.logger.debug(`Could not find dependency "${sdkPackageName}" in project package.json`)
        return
      }

      if (actualSdkVersion.startsWith('workspace:')) {
        return
      }

      const actualCleanedSdkVersion = semver.valid(semver.coerce(actualSdkVersion))
      if (!actualCleanedSdkVersion) {
        this.logger.debug(`Invalid sdk version "${actualSdkVersion}" in project package.json`)
        return
      }

      const cliPkgJson = await this.readPkgJson()
      const expectedSdkVersion = utils.pkgJson.findDependency(cliPkgJson, sdkPackageName)
      if (!expectedSdkVersion) {
        this.logger.debug(`Could not find dependency "${sdkPackageName}" in cli package.json`)
        return
      }

      const expectedCleanedSdkVersion = semver.valid(semver.coerce(expectedSdkVersion))
      if (!expectedCleanedSdkVersion) {
        this.logger.debug(`Invalid sdk version "${expectedSdkVersion}" in cli package.json`)
        return
      }

      if (semver.eq(actualCleanedSdkVersion, expectedCleanedSdkVersion)) {
        return
      }

      const diff = semver.diff(actualCleanedSdkVersion, expectedCleanedSdkVersion)
      if (!diff) {
        this.logger.debug(`Could not compare versions "${actualCleanedSdkVersion}" and "${expectedCleanedSdkVersion}"`)
        return
      }

      const errorMsg = `Project SDK version is "${actualCleanedSdkVersion}", but expected "${expectedCleanedSdkVersion}"`
      if (utils.semver.releases.lt(diff, 'minor')) {
        this.logger.debug(`${errorMsg}. This may cause compatibility issues.`)
        return
      }

      this.logger.warn(chalk.bold(`${errorMsg}. This will cause compatibility issues.`))
    } catch (thrown) {
      const err = errors.BotpressCLIError.map(thrown)
      this.logger.debug(`Failed to check if sdk is up to date: ${err.message}`)
    }
  }
}

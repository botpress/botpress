import type * as client from '@botpress/client'
import type * as sdk from '@botpress/sdk'
import type { YargsConfig } from '@bpinternal/yargs-extra'
import chalk from 'chalk'
import fs from 'fs'
import _ from 'lodash'
import semver from 'semver'
import * as apiUtils from '../api'
import * as codegen from '../code-generation'
import type * as config from '../config'
import * as consts from '../consts'
import * as errors from '../errors'
import { validateIntegrationDefinition, validateBotDefinition } from '../sdk'
import type { CommandArgv, CommandDefinition } from '../typings'
import * as utils from '../utils'
import { GlobalCommand } from './global-command'

export type ProjectCommandDefinition = CommandDefinition<typeof config.schemas.project>
export type ProjectCache = { botId: string; devId: string }

type ConfigurableProjectPaths = { workDir: string }
type ConstantProjectPaths = typeof consts.fromWorkDir
type AllProjectPaths = ConfigurableProjectPaths & ConstantProjectPaths

type LintIgnoredConfig = { bpLintDisabled?: boolean }

export type ProjectType = ProjectDefinition['type']
export type ProjectDefinition = LintIgnoredConfig &
  (
    | { type: 'integration'; definition: sdk.IntegrationDefinition }
    | { type: 'interface'; definition: sdk.InterfaceDefinition }
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
      absWorkingDir: abs.workDir,
      entrypoint: rel.integrationDefinition,
    })

    const artifact = outputFiles[0]
    if (!artifact) {
      throw new errors.BotpressCLIError('Could not read integration definition')
    }

    const { default: definition } = utils.require.requireJsCode<{ default: sdk.IntegrationDefinition }>(artifact.text)
    validateIntegrationDefinition(definition)
    return { definition, bpLintDisabled }
  }

  private async _readInterfaceDefinitionFromFS(
    projectPaths: utils.path.PathStore<'workDir' | 'interfaceDefinition'>
  ): Promise<({ definition: sdk.InterfaceDefinition } & LintIgnoredConfig) | undefined> {
    const abs = projectPaths.abs
    const rel = projectPaths.rel('workDir')

    if (!fs.existsSync(abs.interfaceDefinition)) {
      return
    }

    const bpLintDisabled = await this._isBpLintDisabled(abs.interfaceDefinition)

    const { outputFiles } = await utils.esbuild.buildEntrypoint({
      absWorkingDir: abs.workDir,
      entrypoint: rel.interfaceDefinition,
    })

    const artifact = outputFiles[0]
    if (!artifact) {
      throw new errors.BotpressCLIError('Could not read interface definition')
    }

    const { default: definition } = utils.require.requireJsCode<{ default: sdk.InterfaceDefinition }>(artifact.text)

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
      absWorkingDir: abs.workDir,
      entrypoint: rel.botDefinition,
    })

    const artifact = outputFiles[0]
    if (!artifact) {
      throw new errors.BotpressCLIError('Could not read bot definition')
    }

    const { default: definition } = utils.require.requireJsCode<{ default: sdk.BotDefinition }>(artifact.text)
    validateBotDefinition(definition)
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
      absWorkingDir: abs.workDir,
      entrypoint: rel.pluginDefinition,
    })

    const artifact = outputFiles[0]
    if (!artifact) {
      throw new errors.BotpressCLIError('Could not read plugin definition')
    }

    const { default: definition } = utils.require.requireJsCode<{ default: sdk.PluginDefinition }>(artifact.text)
    // TODO: validate plugin definition
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

  protected async prepareCreateIntegrationBody(
    integrationDef: sdk.IntegrationDefinition
  ): Promise<apiUtils.CreateIntegrationRequestBody> {
    const partialBody = await apiUtils.prepareCreateIntegrationBody(integrationDef)
    const code = await this.readProjectFile(this.projectPaths.abs.outFileCJS)
    const icon = await this.readProjectFile(integrationDef.icon, 'base64')
    const readme = await this.readProjectFile(integrationDef.readme, 'base64')
    const extractScript = await this.readProjectFile(integrationDef.identifier?.extractScript)
    const fallbackHandlerScript = await this.readProjectFile(integrationDef.identifier?.fallbackHandlerScript)
    return {
      ...partialBody,
      code,
      icon,
      readme,
      identifier: {
        extractScript,
        fallbackHandlerScript,
      },
      configuration: integrationDef.configuration
        ? {
            schema: await utils.schema.mapZodToJsonSchema(integrationDef.configuration),
            identifier: {
              required: integrationDef.configuration.identifier?.required,
              linkTemplateScript: await this.readProjectFile(
                integrationDef.configuration.identifier?.linkTemplateScript
              ),
            },
          }
        : undefined,
      configurations: integrationDef.configurations
        ? await utils.records.mapValuesAsync(integrationDef.configurations, async (configuration) => ({
            title: configuration.title,
            description: configuration.description,
            schema: await utils.schema.mapZodToJsonSchema(configuration),
            identifier: {
              required: configuration.identifier?.required,
              linkTemplateScript: await this.readProjectFile(configuration.identifier?.linkTemplateScript),
            },
          }))
        : undefined,
    }
  }

  protected async prepareBotDependencies(
    botDef: sdk.BotDefinition,
    api: apiUtils.ApiClient
  ): Promise<Partial<apiUtils.UpdateBotRequestBody>> {
    const integrations = await this._fetchDependencies(botDef.integrations ?? {}, ({ name, version }) =>
      api.getIntegration({ type: 'name', name, version })
    )
    return {
      integrations: _(integrations)
        .keyBy((i) => i.id)
        .value(),
    }
  }

  protected async prepareIntegrationDependencies(
    integrationDef: sdk.IntegrationDefinition,
    api: apiUtils.ApiClient
  ): Promise<Partial<apiUtils.CreateIntegrationRequestBody>> {
    const interfaces = await this._fetchDependencies(integrationDef.interfaces ?? {}, ({ name, version }) =>
      api.getPublicInterface({ type: 'name', name, version })
    )
    return { interfaces }
  }

  protected async preparePluginDependencies(
    pluginDef: sdk.PluginDefinition,
    api: apiUtils.ApiClient
  ): Promise<Partial<apiUtils.CreatePluginRequestBody>> {
    const integrations = await this._fetchDependencies(pluginDef.integrations ?? {}, ({ name, version }) =>
      api.getIntegration({ type: 'name', name, version })
    )
    const interfaces = await this._fetchDependencies(pluginDef.interfaces ?? {}, ({ name, version }) =>
      api.getPublicInterface({ type: 'name', name, version })
    )
    return {
      dependencies: {
        integrations,
        interfaces,
      },
    }
  }

  private _fetchDependencies = async <T extends { id?: string; name: string; version: string }>(
    deps: Record<string, T>,
    fetcher: (dep: T) => Promise<{ id: string }>
  ): Promise<Record<string, T & { id: string }>> => {
    const isRemote = (dep: T): dep is T & { id: string } => dep.id !== undefined
    return utils.records.mapValuesAsync(deps, async (dep): Promise<T & { id: string }> => {
      if (isRemote(dep)) {
        return dep
      }
      const { id } = await fetcher(dep)
      return { ...dep, id }
    })
  }

  protected readProjectFile = async (
    filePath: string | undefined,
    encoding: BufferEncoding = 'utf-8'
  ): Promise<string | undefined> => {
    if (!filePath) {
      return undefined
    }
    const absoluteFilePath = utils.path.absoluteFrom(this.projectPaths.abs.workDir, filePath)
    return fs.promises.readFile(absoluteFilePath, encoding).catch((thrown) => {
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

import type * as client from '@botpress/client'
import * as sdk from '@botpress/sdk'
import type { YargsConfig } from '@bpinternal/yargs-extra'
import chalk from 'chalk'
import fs from 'fs'
import _ from 'lodash'
import semver from 'semver'
import * as apiUtils from '../api'
import * as codegen from '../code-generation'
import * as config from '../config'
import * as consts from '../consts'
import * as errors from '../errors'
import { validateIntegrationDefinition, validateBotDefinition } from '../sdk'
import type { CommandArgv, CommandDefinition } from '../typings'
import * as utils from '../utils'
import { GlobalCommand } from './global-command'

export type ProjectCommandDefinition = CommandDefinition<typeof config.schemas.project>
export type ProjectCache = {
  botId: string
  devId: string
  tunnelId: string
  secrets: {
    [secretName: string]: string
  }
}

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

type ProjectDefinitionResolver<T> = () => Promise<LintIgnoredConfig & T>

export type ProjectDefinitionLazy =
  | {
      projectType: 'integration'
      resolveProjectDefinition: ProjectDefinitionResolver<{
        type: 'integration'
        definition: sdk.IntegrationDefinition
      }>
    }
  | {
      projectType: 'bot'
      resolveProjectDefinition: ProjectDefinitionResolver<{ type: 'bot'; definition: sdk.BotDefinition }>
    }
  | {
      projectType: 'interface'
      resolveProjectDefinition: ProjectDefinitionResolver<{ type: 'interface'; definition: sdk.InterfaceDefinition }>
    }
  | {
      projectType: 'plugin'
      resolveProjectDefinition: ProjectDefinitionResolver<{ type: 'plugin'; definition: sdk.PluginDefinition }>
    }

type UpdatedBot = client.Bot

type ClientIntegrationDefinitions = Record<string, client.Integration>
type ClientIntegration = client.Bot['integrations'][string]

class ProjectPaths extends utils.path.PathStore<keyof AllProjectPaths> {
  public constructor(argv: CommandArgv<ProjectCommandDefinition>) {
    const absWorkDir = utils.path.absoluteFrom(utils.path.cwd(), argv.workDir)
    super({
      workDir: absWorkDir,
      ..._.mapValues(consts.fromWorkDir, (p) => utils.path.absoluteFrom(absWorkDir, p)),
    })
  }
}

export class ProjectDefinitionContext {
  private _codeCache: Map<string, object> = new Map()
  private _buildContext: utils.esbuild.BuildEntrypointContext = new utils.esbuild.BuildEntrypointContext()

  public getOrResolveDefinition<T extends object>(code: string): T {
    const definition = this._codeCache.get(code)
    if (definition) {
      return definition as T
    }
    const result = utils.require.requireJsCode<{ default: object }>(code)
    this._codeCache.set(code, result.default)
    return result.default as T
  }

  public rebuildEntrypoint(...args: Parameters<utils.esbuild.BuildEntrypointContext['rebuild']>) {
    return this._buildContext.rebuild(...args)
  }
}

type ResolvedDependency = { id: string }
type DependencyCacheKey = `${'integration' | 'plugin' | 'interface'}:${string}@${string}`

export abstract class ProjectCommand<C extends ProjectCommandDefinition> extends GlobalCommand<C> {
  protected projectContext: ProjectDefinitionContext = new ProjectDefinitionContext()
  private _dependencyCache = new Map<DependencyCacheKey, ResolvedDependency>()

  public setProjectContext(projectContext: ProjectDefinitionContext) {
    this.projectContext = projectContext
    return this
  }

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

  private _readProjectType(projectPaths: ProjectPaths): ProjectType {
    const abs = projectPaths.abs
    if (fs.existsSync(abs.integrationDefinition)) {
      return 'integration'
    }
    if (fs.existsSync(abs.interfaceDefinition)) {
      return 'interface'
    }
    if (fs.existsSync(abs.botDefinition)) {
      return 'bot'
    }
    if (fs.existsSync(abs.pluginDefinition)) {
      return 'plugin'
    }
    throw new errors.UnsupportedProjectType()
  }

  protected readProjectDefinitionFromFS(): ProjectDefinitionLazy {
    try {
      const type = this._readProjectType(this.projectPaths)
      if (type === 'integration') {
        return {
          projectType: 'integration',
          resolveProjectDefinition: async () => ({
            type: 'integration',
            ...(await this._readIntegrationDefinitionFromFS(this.projectPaths)),
          }),
        }
      }
      if (type === 'plugin') {
        return {
          projectType: 'plugin',
          resolveProjectDefinition: async () => ({
            type: 'plugin',
            ...(await this._readPluginDefinitionFromFS(this.projectPaths)),
          }),
        }
      }
      if (type === 'interface') {
        return {
          projectType: 'interface',
          resolveProjectDefinition: async () => ({
            type: 'interface',
            ...(await this._readInterfaceDefinitionFromFS(this.projectPaths)),
          }),
        }
      }
      if (type === 'bot') {
        return {
          projectType: 'bot',
          resolveProjectDefinition: async () => ({
            type: 'bot',
            ...(await this._readBotDefinitionFromFS(this.projectPaths)),
          }),
        }
      }
    } catch (thrown: unknown) {
      throw errors.BotpressCLIError.wrap(thrown, 'Error while reading project definition')
    }
    throw new errors.ProjectDefinitionNotFoundError(this.projectPaths.abs.workDir)
  }

  private async _readIntegrationDefinitionFromFS(
    projectPaths: utils.path.PathStore<'workDir' | 'integrationDefinition'>
  ): Promise<{ definition: sdk.IntegrationDefinition } & LintIgnoredConfig> {
    const abs = projectPaths.abs
    const rel = projectPaths.rel('workDir')

    if (!fs.existsSync(abs.integrationDefinition)) {
      throw new errors.BotpressCLIError('Could not read integration definition')
    }

    const bpLintDisabled = await this._isBpLintDisabled(abs.integrationDefinition)

    const { outputFiles } = await this.projectContext.rebuildEntrypoint({
      absWorkingDir: abs.workDir,
      entrypoint: rel.integrationDefinition,
    })

    const artifact = outputFiles?.[0]
    if (!artifact) {
      throw new errors.BotpressCLIError('Could not read integration definition')
    }

    const definition = this.projectContext.getOrResolveDefinition<sdk.IntegrationDefinition>(artifact.text)
    validateIntegrationDefinition(definition)
    return { definition, bpLintDisabled }
  }

  private async _readInterfaceDefinitionFromFS(
    projectPaths: utils.path.PathStore<'workDir' | 'interfaceDefinition'>
  ): Promise<{ definition: sdk.InterfaceDefinition } & LintIgnoredConfig> {
    const abs = projectPaths.abs
    const rel = projectPaths.rel('workDir')

    if (!fs.existsSync(abs.interfaceDefinition)) {
      throw new errors.BotpressCLIError('Could not read interface definition')
    }

    const bpLintDisabled = await this._isBpLintDisabled(abs.interfaceDefinition)

    const { outputFiles } = await this.projectContext.rebuildEntrypoint({
      absWorkingDir: abs.workDir,
      entrypoint: rel.interfaceDefinition,
    })

    const artifact = outputFiles?.[0]
    if (!artifact) {
      throw new errors.BotpressCLIError('Could not read interface definition')
    }

    const definition = this.projectContext.getOrResolveDefinition<sdk.InterfaceDefinition>(artifact.text)

    return { definition, bpLintDisabled }
  }

  private async _readBotDefinitionFromFS(
    projectPaths: utils.path.PathStore<'workDir' | 'botDefinition'>
  ): Promise<{ definition: sdk.BotDefinition } & LintIgnoredConfig> {
    const abs = projectPaths.abs
    const rel = projectPaths.rel('workDir')

    if (!fs.existsSync(abs.botDefinition)) {
      throw new errors.BotpressCLIError('Could not read bot definition')
    }

    const bpLintDisabled = await this._isBpLintDisabled(abs.botDefinition)

    const { outputFiles } = await this.projectContext.rebuildEntrypoint({
      absWorkingDir: abs.workDir,
      entrypoint: rel.botDefinition,
    })

    const artifact = outputFiles?.[0]
    if (!artifact) {
      throw new errors.BotpressCLIError('Could not read bot definition')
    }

    const definition = this.projectContext.getOrResolveDefinition<sdk.BotDefinition>(artifact.text)
    validateBotDefinition(definition)
    return { definition, bpLintDisabled }
  }

  private async _readPluginDefinitionFromFS(
    projectPaths: utils.path.PathStore<'workDir' | 'pluginDefinition'>
  ): Promise<{ definition: sdk.PluginDefinition } & LintIgnoredConfig> {
    const abs = projectPaths.abs
    const rel = projectPaths.rel('workDir')

    if (!fs.existsSync(abs.pluginDefinition)) {
      throw new errors.BotpressCLIError('Could not read plugin definition')
    }

    const bpLintDisabled = await this._isBpLintDisabled(abs.pluginDefinition)

    const { outputFiles } = await this.projectContext.rebuildEntrypoint({
      absWorkingDir: abs.workDir,
      entrypoint: rel.pluginDefinition,
    })

    const artifact = outputFiles?.[0]
    if (!artifact) {
      throw new errors.BotpressCLIError('Could not read plugin definition')
    }

    const definition = this.projectContext.getOrResolveDefinition<sdk.PluginDefinition>(artifact.text)
    // TODO: validate plugin definition
    return { definition, bpLintDisabled }
  }

  private async _isBpLintDisabled(definitionPath: string): Promise<boolean> {
    const tsContent = await fs.promises.readFile(definitionPath, 'utf-8')
    const regex = /\/\* bplint-disable \*\//
    return regex.test(tsContent)
  }

  protected async displayIntegrationUrls({ api, bot }: { api: apiUtils.ApiClient; bot: client.Bot }) {
    if (!_.keys(bot.integrations).length) {
      this.logger.debug('No integrations in bot')
      return
    }

    const integrationDefinitions = await utils.records.mapValuesAsync(bot.integrations, async (integration) =>
      api.getPublicOrPrivateIntegration({
        type: 'id',
        id: integration.id,
      })
    )

    this.logger.log('Integrations:')
    for (const [alias, integration] of Object.entries(bot.integrations)) {
      if (integration.enabled) {
        this.logger.log(`${alias} ${integration.version}:`, { prefix: { symbol: '→', indent: 2 } })
      } else {
        this.logger.log(`${alias} ${integration.version} ${chalk.italic('(disabled)')}:`, {
          prefix: { symbol: '→', indent: 2 },
        })
      }

      const integrationDefinition = integrationDefinitions[alias]
      const linkTemplateScript = integrationDefinition
        ? this._getLinkTemplateScript({ integration, integrationDefinition })
        : undefined
      this._displayWebhookUrl({ integration, integrationDefinition, linkTemplateScript })
      if (!integrationDefinition) {
        this.logger.debug(
          `No integration definition for integration ${alias} (${integration.name}, ${integration.id}), skipping OAuth or Sandbox links`
        )
        this.logger.line().commit()
        continue
      }
      const isSandbox =
        integration.configurationType === 'sandbox' && !!integrationDefinition.sandbox?.identifierExtractScript
      const showLink = !!linkTemplateScript && (isSandbox || !!integrationDefinition.identifier?.extractScript)
      if (showLink && isSandbox) {
        await this._displaySandboxLinkAndCode({ integration, alias, bot, api, linkTemplateScript })
      } else if (showLink) {
        this._displayAuthorizationLink({ integration, api, linkTemplateScript })
      }
      this.logger.line().commit()
    }
  }

  private _getLinkTemplateScript({
    integration,
    integrationDefinition,
  }: {
    integration: ClientIntegration
    integrationDefinition?: ClientIntegrationDefinitions[string]
  }) {
    const config =
      integration.configurationType === null
        ? integrationDefinition?.configuration
        : integrationDefinition?.configurations[integration.configurationType]
    return config?.identifier?.linkTemplateScript
  }

  private _displayWebhookUrl({
    integration,
    integrationDefinition,
    linkTemplateScript,
  }: {
    integration: ClientIntegration
    integrationDefinition?: ClientIntegrationDefinitions[string]
    linkTemplateScript?: string
  }) {
    const needsWebhook = !(integrationDefinition?.identifier && linkTemplateScript)
    const logFn = (needsWebhook ? this.logger.log : this.logger.debug).bind(this.logger)

    if (integration.enabled) {
      logFn(`${chalk.bold('Webhook')}: ${integration.webhookUrl}`, {
        prefix: { symbol: '●', indent: 4 },
      })
    } else {
      logFn(`Webhook: ${integration.webhookUrl}`, {
        prefix: { symbol: '○', indent: 4 },
      })
    }
  }

  private _displayAuthorizationLink({
    integration,
    api,
    linkTemplateScript,
  }: {
    integration: ClientIntegration
    api: apiUtils.ApiClient
    linkTemplateScript: string
  }) {
    const authorizationLink = this._getAuthorizationLink({ integration, api, linkTemplateScript })
    const isAuthorized = !!integration.identifier
    const authorizationStatus = integration.identifier ? 'Authorized ✓' : 'Authorize'
    if (integration.enabled && isAuthorized) {
      this.logger.log(`${chalk.bold(authorizationStatus)} : ${authorizationLink}`, {
        prefix: { symbol: '●', indent: 4 },
      })
    } else {
      this.logger.log(`${authorizationStatus}: ${authorizationLink}`, {
        prefix: { symbol: '○', indent: 4 },
      })
    }
  }

  private _getLinkTemplateArgs({ integration, api }: { integration: ClientIntegration; api: apiUtils.ApiClient }) {
    // These are the values used by the studio
    let env: 'development' | 'preview' | 'production'
    if (api.url.includes(consts.stagingBotpressDomain)) {
      env = 'preview'
    } else if (api.url.includes(consts.productionBotpressDomain)) {
      env = 'production'
    } else {
      env = 'development'
    }
    return {
      env,
      webhookId: integration.webhookId,
      webhookUrl: api.url.replace('api', 'webhook'),
    }
  }

  private _getAuthorizationLink({
    integration,
    api,
    linkTemplateScript,
  }: {
    integration: client.Bot['integrations'][string]
    api: apiUtils.ApiClient
    linkTemplateScript: string
  }) {
    return utils.vrl.getStringResult({
      code: linkTemplateScript,
      data: this._getLinkTemplateArgs({ integration, api }),
    })
  }

  private _getSandboxLink({
    shareableId,
    integration,
    api,
    linkTemplateScript,
  }: {
    shareableId: string
    integration: ClientIntegration
    api: apiUtils.ApiClient
    linkTemplateScript: string
  }) {
    return utils.vrl.getStringResult({
      code: linkTemplateScript,
      data: { shareableId, ...this._getLinkTemplateArgs({ integration, api }) },
    })
  }

  private async _displaySandboxLinkAndCode({
    integration,
    alias,
    bot,
    api,
    linkTemplateScript,
  }: {
    integration: ClientIntegration
    alias: string
    bot: client.Bot
    api: apiUtils.ApiClient
    linkTemplateScript: string
  }) {
    const shareableId = await api.getOrGenerateShareableId(bot.id, integration.id, alias)
    const sandboxLink = this._getSandboxLink({ shareableId, integration, api, linkTemplateScript })
    const sandboxInstruction = `Send '${shareableId}' to ${sandboxLink}`
    if (integration.enabled) {
      this.logger.log(`${chalk.bold('Sandbox')}: ${sandboxInstruction}`, {
        prefix: { symbol: '●', indent: 4 },
      })
    } else {
      this.logger.log(`Sandbox: ${sandboxInstruction}`, {
        prefix: { symbol: '○', indent: 4 },
      })
    }
  }

  protected async promptSecrets(
    def: { secrets?: Record<string, sdk.SecretDefinition> },
    argv: YargsConfig<typeof config.schemas.secrets>,
    opts: { formatEnv?: boolean; knownSecrets?: string[] } = {}
  ): Promise<Record<string, string | null>> {
    const formatEnv = opts.formatEnv ?? false
    const knownSecrets = opts.knownSecrets ?? []

    const { secrets: secretDefinitions } = def
    if (!secretDefinitions) {
      return {}
    }

    const secretArgv = this._parseArgvSecrets(argv.secrets)
    const invalidSecret = Object.keys(secretArgv).find((s) => !secretDefinitions[s])
    if (invalidSecret) {
      throw new errors.BotpressCLIError(`Secret ${invalidSecret} is not defined in the definition`)
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

    let code: string | undefined = undefined
    if (fs.existsSync(this.projectPaths.abs.outFileCJS)) {
      code = await this.readProjectFile(this.projectPaths.abs.outFileCJS)
    }

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
            schema: await utils.schema.mapZodToJsonSchema(integrationDef.configuration, {
              useLegacyZuiTransformer: integrationDef.__advanced?.useLegacyZuiTransformer,
              toJSONSchemaOptions: integrationDef.__advanced?.toJSONSchemaOptions,
            }),
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
            schema: await utils.schema.mapZodToJsonSchema(configuration, {
              useLegacyZuiTransformer: integrationDef.__advanced?.useLegacyZuiTransformer,
              toJSONSchemaOptions: integrationDef.__advanced?.toJSONSchemaOptions,
            }),
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
    const integrations = await this._fetchDependencies({
      deps: botDef.integrations ?? {},
      fetcher: ({ name, version }) => api.getPublicOrPrivateIntegration({ type: 'name', name, version }),
      cacheKey: ({ name, version }) => `integration:${name}@${version}`,
    })

    const plugins = await this._fetchDependencies({
      deps: botDef.plugins ?? {},
      fetcher: async ({ name, version }) => await api.getPublicOrPrivatePlugin({ type: 'name', name, version }),
      cacheKey: ({ name, version }) => `plugin:${name}@${version}`,
    })

    const pluginsWithBackingIntegrations = await utils.records.mapValuesAsync(plugins, async (plugin) => ({
      ...plugin,
      interfaces: await this._fetchDependencies({
        deps: plugin.interfaces ?? {},
        fetcher: async ({ name, version }) => await api.getPublicOrPrivateIntegration({ name, version, type: 'name' }),
        cacheKey: ({ name, version }) => `interface:${name}@${version}`,
      }),
      integrations: await this._fetchDependencies({
        deps: plugin.integrations ?? {},
        fetcher: async ({ name, version }) => await api.getPublicOrPrivateIntegration({ name, version, type: 'name' }),
        cacheKey: ({ name, version }) => `integration:${name}@${version}`,
      }),
    }))

    return {
      integrations: utils.records.mapValues(
        integrations,
        ({ enabled, configurationType, configuration, disabledChannels, id }) =>
          ({
            enabled,
            configurationType,
            configuration,
            disabledChannels,
            integrationId: id,
          }) satisfies NonNullable<apiUtils.UpdateBotRequestBody['integrations']>[string]
      ),
      plugins: utils.records.mapValues(pluginsWithBackingIntegrations, (plugin) => ({
        ...plugin,
        interfaces: utils.records.mapValues(
          plugin.interfaces ?? {},
          (iface) =>
            ({
              integrationId: iface.id,
              integrationAlias: iface.integrationAlias,
              integrationInterfaceAlias: iface.integrationInterfaceAlias,
            }) satisfies NonNullable<
              NonNullable<NonNullable<apiUtils.UpdateBotRequestBody['plugins']>[string]>['interfaces']
            >[string]
        ),
        integrations: utils.records.mapValues(
          plugin.integrations ?? {},
          (integration) =>
            ({
              integrationId: integration.id,
              integrationAlias: integration.integrationAlias,
            }) satisfies NonNullable<
              NonNullable<NonNullable<apiUtils.UpdateBotRequestBody['plugins']>[string]>['integrations']
            >[string]
        ),
      })),
    }
  }

  protected async prepareIntegrationDependencies(
    integrationDef: sdk.IntegrationDefinition,
    api: apiUtils.ApiClient
  ): Promise<Partial<apiUtils.CreateIntegrationRequestBody>> {
    const interfaces = await this._fetchDependencies({
      deps: integrationDef.interfaces ?? {},
      fetcher: ({ name, version }) => api.getPublicInterface({ type: 'name', name, version }),
      cacheKey: (dep) => `interface:${dep.name}@${dep.version}`,
    })
    return { interfaces }
  }

  protected async preparePluginDependencies(
    pluginDef: sdk.PluginDefinition,
    api: apiUtils.ApiClient
  ): Promise<Partial<apiUtils.CreatePluginRequestBody>> {
    const integrations = await this._fetchDependencies({
      deps: pluginDef.integrations ?? {},
      fetcher: ({ name, version }) => api.getPublicOrPrivateIntegration({ type: 'name', name, version }),
      cacheKey: (dep) => `integration:${dep.name}@${dep.version}`,
    })
    const interfaces = await this._fetchDependencies({
      deps: pluginDef.interfaces ?? {},
      fetcher: ({ name, version }) => api.getPublicInterface({ type: 'name', name, version }),
      cacheKey: (dep) => `interface:${dep.name}@${dep.version}`,
    })
    return {
      dependencies: {
        integrations,
        interfaces,
      },
    }
  }

  private _fetchDependencies = async <T extends { id?: string; name: string; version: string }>({
    deps,
    fetcher,
    cacheKey: getCacheKey,
  }: {
    deps: Record<string, T>
    fetcher: (dep: T) => Promise<ResolvedDependency>
    cacheKey: (dep: T) => DependencyCacheKey
  }): Promise<Record<string, T & ResolvedDependency>> => {
    const isRemote = (dep: T): dep is T & ResolvedDependency => dep.id !== undefined
    return utils.records.mapValuesAsync(deps, async (dep): Promise<T & ResolvedDependency> => {
      if (isRemote(dep)) {
        return dep
      }

      const cacheKey = getCacheKey(dep)
      const cached = this._dependencyCache.get(cacheKey)

      if (cached) {
        return { ...dep, id: cached.id }
      }

      const { id } = await fetcher(dep)
      this._dependencyCache.set(cacheKey, { id })

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
      const readProjectPkgJsonResult = await utils.pkgJson.safeReadPackageJson(workDir)
      if (!readProjectPkgJsonResult.success) {
        this.logger.debug(`Could not read package.json at "${workDir}": ${readProjectPkgJsonResult.error.message}`)
        return
      }

      if (!readProjectPkgJsonResult.pkgJson) {
        this.logger.debug(`Could not find package.json at "${workDir}"`)
        return
      }

      const { pkgJson: projectPkgJson } = readProjectPkgJsonResult
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

      const cliPkgJson = await this.readCLIPkgJson()
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
  protected validateIntegrationRegistration(
    updatedBot: UpdatedBot,
    onFailCallback: (failedIntegrations: UpdatedBot['integrations']) => void
  ) {
    let failedIntegrations: UpdatedBot['integrations'] = {}
    for (const [integrationName, integration] of Object.entries(updatedBot.integrations)) {
      if (integration.status === 'registration_failed') {
        failedIntegrations = { ...failedIntegrations, [integrationName]: integration }
      }
    }
    if (Object.keys(failedIntegrations).length > 0) {
      onFailCallback(failedIntegrations)
    }
  }

  protected async manageWorkspaceHandle(
    api: apiUtils.ApiClient,
    integration: sdk.IntegrationDefinition
  ): Promise<
    | {
        integration: sdk.IntegrationDefinition
        workspaceId?: string
      }
    | undefined
  > {
    const { name: localName, workspaceHandle: localHandle } = this._parseIntegrationName(integration.name)
    if (!localHandle && api.isBotpressWorkspace) {
      this.logger.debug('Botpress workspace detected; workspace handle omitted')
      return { integration } // botpress has the right to omit workspace handle
    }

    const { handle: remoteHandle, name: workspaceName } = await api.getWorkspace().catch((thrown) => {
      throw errors.BotpressCLIError.wrap(thrown, 'Could not fetch workspace')
    })

    if (localHandle && remoteHandle) {
      let workspaceId: string | undefined = undefined
      if (localHandle !== remoteHandle) {
        const remoteWorkspace = await api.findWorkspaceByHandle(localHandle).catch((thrown) => {
          throw errors.BotpressCLIError.wrap(thrown, 'Could not list workspaces')
        })
        if (!remoteWorkspace) {
          throw new errors.BotpressCLIError(
            `The integration handle "${localHandle}" is not associated with any of your workspaces.`
          )
        }
        this.logger.warn(
          `Your are logged in to workspace "${workspaceName}" but integration handle "${localHandle}" belongs to "${remoteWorkspace.name}".`
        )
        const confirmUseAlternateWorkspace = await this.prompt.confirm(
          'Do you want to deploy integration on this workspace instead?'
        )
        if (!confirmUseAlternateWorkspace) {
          throw new errors.BotpressCLIError(
            `Cannot deploy integration with handle "${localHandle}" on workspace "${workspaceName}"`
          )
        }

        workspaceId = remoteWorkspace.id
      }
      return { integration, workspaceId }
    }

    const workspaceHandleIsMandatoryMsg = 'Cannot deploy integration without workspace handle'

    if (!localHandle && remoteHandle) {
      const confirmAddHandle = await this.prompt.confirm(
        `Your current workspace handle is "${remoteHandle}". Do you want to use the name "${remoteHandle}/${localName}"?`
      )
      if (!confirmAddHandle) {
        this.logger.log('Aborted')
        return
      }
      const newName = `${remoteHandle}/${localName}`
      return { integration: new sdk.IntegrationDefinition({ ...integration, name: newName }) }
    }

    if (localHandle && !remoteHandle) {
      const { available } = await api.client.checkHandleAvailability({ handle: localHandle }).catch((thrown) => {
        throw errors.BotpressCLIError.wrap(thrown, 'Could not check handle availability')
      })

      if (!available) {
        throw new errors.BotpressCLIError(`Handle "${localHandle}" is not yours and is not available`)
      }

      const confirmClaimHandle = await this.prompt.confirm(
        `Handle "${localHandle}" is available. Do you want to claim it for your workspace ${workspaceName}?`
      )
      if (!confirmClaimHandle) {
        throw new errors.BotpressCLIError(workspaceHandleIsMandatoryMsg)
      }

      await api.updateWorkspace({ handle: localHandle }).catch((thrown) => {
        throw errors.BotpressCLIError.wrap(thrown, `Could not claim handle "${localHandle}"`)
      })

      this.logger.success(`Handle "${localHandle}" is now yours!`)
      return { integration }
    }

    this.logger.warn("It seems you don't have a workspace handle yet.")
    let claimedHandle: string | undefined = undefined
    do {
      const prompted = await this.prompt.text('Please enter a workspace handle')
      if (!prompted) {
        throw new errors.BotpressCLIError(workspaceHandleIsMandatoryMsg)
      }

      const { available, suggestions } = await api.client.checkHandleAvailability({ handle: prompted })
      if (!available) {
        this.logger.warn(`Handle "${prompted}" is not available. Suggestions: ${suggestions.join(', ')}`)
        continue
      }

      claimedHandle = prompted
      await api.updateWorkspace({ handle: claimedHandle }).catch((thrown) => {
        throw errors.BotpressCLIError.wrap(thrown, `Could not claim handle "${claimedHandle}"`)
      })
    } while (!claimedHandle)

    this.logger.success(`Handle "${claimedHandle}" is yours!`)
    const newName = `${claimedHandle}/${localName}`
    return { integration: new sdk.IntegrationDefinition({ ...integration, name: newName }) }
  }

  protected _parseIntegrationName = (integrationName: string): { name: string; workspaceHandle?: string } => {
    const parts = integrationName.split('/')
    if (parts.length > 2) {
      throw new errors.BotpressCLIError(
        `Invalid integration name "${integrationName}": a single forward slash is allowed`
      )
    }
    if (parts.length === 2) {
      const [workspaceHandle, name] = parts as [string, string]
      return { name, workspaceHandle }
    }
    const [name] = parts as [string]
    return { name }
  }
}

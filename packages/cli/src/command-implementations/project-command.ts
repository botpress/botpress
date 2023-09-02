import type * as bpclient from '@botpress/client'
import type * as bpsdk from '@botpress/sdk'
import type { YargsConfig } from '@bpinternal/yargs-extra'
import bluebird from 'bluebird'
import chalk from 'chalk'
import fs from 'fs'
import _ from 'lodash'
import pathlib from 'path'
import semver from 'semver'
import { ApiClient } from '../api/client'
import * as codegen from '../code-generation'
import type * as config from '../config'
import * as consts from '../consts'
import * as errors from '../errors'
import { formatIntegrationRef, IntegrationRef } from '../integration-ref'
import type { CommandArgv, CommandDefinition } from '../typings'
import * as utils from '../utils'
import { GlobalCommand } from './global-command'

export type ProjectCommandDefinition = CommandDefinition<typeof config.schemas.project>
export type ProjectCache = { botId: string; devId: string }

type ConfigurableProjectPaths = { entryPoint: string; outDir: string; workDir: string }
type ConstantProjectPaths = typeof consts.fromOutDir & typeof consts.fromWorkDir
type AllProjectPaths = ConfigurableProjectPaths & ConstantProjectPaths

type ApiIntegrationInstance = utils.types.Merge<bpsdk.IntegrationInstance<string>, { id: string }>
type LocalIntegrationInstance = utils.types.Merge<bpsdk.IntegrationInstance<string>, { id: null }>

class ProjectPaths extends utils.path.PathStore<keyof AllProjectPaths> {
  public constructor(argv: CommandArgv<ProjectCommandDefinition>) {
    const absWorkDir = utils.path.absoluteFrom(utils.path.cwd(), argv.workDir)
    const absEntrypoint = utils.path.absoluteFrom(absWorkDir, argv.entryPoint)
    const absOutDir = utils.path.absoluteFrom(absWorkDir, argv.outDir)
    super({
      workDir: absWorkDir,
      entryPoint: absEntrypoint,
      outDir: absOutDir,
      ..._.mapValues(consts.fromOutDir, (p) => utils.path.absoluteFrom(absOutDir, p)),
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

  protected async prepareBotIntegrationInstances(bot: bpsdk.Bot, api: ApiClient) {
    const integrationList = _(bot.props.integrations).values().filter(utils.guards.is.defined).value()

    const { apiInstances, localInstances } = this._splitApiAndLocalIntegrationInstances(integrationList)

    const fetchedInstances: ApiIntegrationInstance[] = await bluebird.map(localInstances, async (instance) => {
      const ref: IntegrationRef = { type: 'name', name: instance.name, version: instance.version }
      const integration = await api.findIntegration(ref)
      if (!integration) {
        const formattedRef = formatIntegrationRef(ref)
        throw new errors.BotpressCLIError(`Integration "${formattedRef}" not found`)
      }
      return { ...instance, id: integration.id }
    })

    return {
      integrations: _([...fetchedInstances, ...apiInstances])
        .keyBy((i) => i.id)
        .mapValues(({ enabled, configuration }) => ({ enabled, configuration }))
        .value(),
    }
  }

  private _splitApiAndLocalIntegrationInstances(instances: bpsdk.IntegrationInstance<string>[]): {
    apiInstances: ApiIntegrationInstance[]
    localInstances: LocalIntegrationInstance[]
  } {
    const apiInstances: ApiIntegrationInstance[] = []
    const localInstances: LocalIntegrationInstance[] = []
    for (const { id, ...instance } of instances) {
      if (id) {
        apiInstances.push({ ...instance, id })
      } else {
        localInstances.push({ ...instance, id: null })
      }
    }

    return { apiInstances, localInstances }
  }

  protected prepareBot(bot: bpsdk.Bot) {
    return {
      ...bot.props,
      configuration: bot.props.configuration
        ? {
            ...bot.props.configuration,
            schema: utils.schema.mapZodToJsonSchema(bot.props.configuration),
          }
        : undefined,
      events: bot.props.events
        ? _.mapValues(bot.props.events, (event) => ({
            ...event,
            schema: utils.schema.mapZodToJsonSchema(event),
          }))
        : undefined,
      states: bot.props.states
        ? _.mapValues(bot.props.states, (state) => ({
            ...state,
            schema: utils.schema.mapZodToJsonSchema(state),
          }))
        : undefined,
    }
  }

  protected prepareIntegrationDefinition(integration: bpsdk.IntegrationDefinition) {
    return {
      ...integration,
      configuration: integration.configuration
        ? {
            ...integration.configuration,
            schema: utils.schema.mapZodToJsonSchema(integration.configuration),
          }
        : undefined,
      events: integration.events
        ? _.mapValues(integration.events, (event) => ({
            ...event,
            schema: utils.schema.mapZodToJsonSchema(event),
          }))
        : undefined,
      actions: integration.actions
        ? _.mapValues(integration.actions, (action) => ({
            ...action,
            input: {
              ...action.input,
              schema: utils.schema.mapZodToJsonSchema(action.input),
            },
            output: {
              ...action.output,
              schema: utils.schema.mapZodToJsonSchema(action.output),
            },
          }))
        : undefined,
      channels: integration.channels
        ? _.mapValues(integration.channels, (channel) => ({
            ...channel,
            messages: _.mapValues(channel.messages, (message) => ({
              ...message,
              schema: utils.schema.mapZodToJsonSchema(message),
            })),
          }))
        : undefined,
      states: integration.states
        ? _.mapValues(integration.states, (state) => ({
            ...state,
            schema: utils.schema.mapZodToJsonSchema(state),
          }))
        : undefined,
    }
  }

  protected async readIntegrationDefinitionFromFS(
    projectPaths: utils.path.PathStore<'workDir' | 'definition'> = this.projectPaths
  ): Promise<bpsdk.IntegrationDefinition | undefined> {
    const abs = projectPaths.abs
    const rel = projectPaths.rel('workDir')

    if (!fs.existsSync(abs.definition)) {
      this.logger.debug(`Integration definition not found at ${rel.definition}`)
      return
    }

    const { outputFiles } = await utils.esbuild.buildEntrypoint({
      cwd: abs.workDir,
      outfile: '',
      entrypoint: rel.definition,
      write: false,
    })

    const artifact = outputFiles[0]
    if (!artifact) {
      throw new errors.BotpressCLIError('Could not read integration definition')
    }

    const { default: definition } = utils.require.requireJsCode<{ default: bpsdk.IntegrationDefinition }>(artifact.text)
    return definition
  }

  protected async writeGeneratedFilesToOutFolder(files: codegen.File[]) {
    for (const file of files) {
      const filePath = utils.path.absoluteFrom(this.projectPaths.abs.outDir, file.path)
      const dirPath = pathlib.dirname(filePath)
      await fs.promises.mkdir(dirPath, { recursive: true })
      await fs.promises.writeFile(filePath, file.content)
    }
  }

  protected displayWebhookUrls(bot: bpclient.Bot) {
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
    integrationDef: bpsdk.IntegrationDefinition,
    argv: YargsConfig<typeof config.schemas.secrets>
  ): Promise<Record<string, string>> {
    const { secrets: secretDefinitions } = integrationDef
    if (!secretDefinitions) {
      return {}
    }

    const secretArgv = this._parseArgvSecrets(argv.secrets)
    const invalidSecret = Object.keys(secretArgv).find((s) => !secretDefinitions[s])
    if (invalidSecret) {
      throw new errors.BotpressCLIError(`Secret ${invalidSecret} is not defined in integration definition`)
    }

    const values: Record<string, string> = {}
    for (const [secretName, { optional }] of Object.entries(secretDefinitions)) {
      const argvSecret = secretArgv[secretName]
      if (argvSecret) {
        this.logger.debug(`Using secret "${secretName}" from argv`)
        values[secretName] = argvSecret
        continue
      }

      const mode = optional ? 'optional' : 'required'
      const prompted = await this.prompt.text(`Enter value for secret "${secretName}" (${mode})`)
      if (prompted) {
        values[secretName] = prompted
        continue
      }

      if (optional) {
        this.logger.warn(`Secret "${secretName}" is unassigned`)
        continue
      }

      throw new errors.BotpressCLIError(`Secret "${secretName}" is required`)
    }

    const envVariables = _.mapKeys(values, (_v, k) => codegen.secretEnvVariableName(k))
    return envVariables
  }

  private _parseArgvSecrets(argvSecrets: string[]): Record<string, string> {
    const parsed: Record<string, string> = {}
    for (const secret of argvSecrets) {
      const [key, value] = this._splitOnce(secret, '=')
      if (!value) {
        throw new errors.BotpressCLIError(
          `Secret "${key}" is missing a value. Expected format: "SECRET_NAME=secretValue"`
        )
      }
      parsed[key!] = value
    }

    return parsed
  }

  private _splitOnce = (text: string, separator: string): [string, string | undefined] => {
    const index = text.indexOf(separator)
    if (index === -1) {
      return [text, undefined]
    }
    return [text.slice(0, index), text.slice(index + 1)]
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

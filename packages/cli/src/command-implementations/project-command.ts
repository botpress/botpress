import type * as bpclient from '@botpress/client'
import type { IntegrationDefinition, Bot as BotImpl } from '@botpress/sdk'
import type { YargsConfig } from '@bpinternal/yargs-extra'
import chalk from 'chalk'
import fs from 'fs'
import _ from 'lodash'
import pathlib from 'path'
import * as codegen from '../code-generation'
import type * as config from '../config'
import * as consts from '../consts'
import * as errors from '../errors'
import type { CommandArgv, CommandDefinition } from '../typings'
import * as utils from '../utils'
import { GlobalCommand } from './global-command'

type IntegrationInstances = Parameters<bpclient.Client['updateBot']>[0]['integrations']

export type ProjectCommandDefinition = CommandDefinition<typeof config.schemas.project>
export type ProjectCache = { botId: string; devId: string }

type ConfigurableProjectPaths = { entryPoint: string; outDir: string; workDir: string }
type ConstantProjectPaths = typeof consts.fromOutDir & typeof consts.fromWorkDir
type AllProjectPaths = ConfigurableProjectPaths & ConstantProjectPaths

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
  protected get projectPaths() {
    return new ProjectPaths(this.argv)
  }

  protected get projectCache() {
    return new utils.cache.FSKeyValueCache<ProjectCache>(this.projectPaths.abs.projectCacheFile)
  }

  protected async readIntegrationDefinitionFromFS(): Promise<IntegrationDefinition | undefined> {
    const abs = this.projectPaths.abs
    const rel = this.projectPaths.rel('workDir')

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

    const { default: definition } = utils.require.requireJsCode<{ default: IntegrationDefinition }>(artifact.text)
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

  protected prepareIntegrations(botImpl: BotImpl, botInfo: bpclient.Bot): IntegrationInstances {
    const { integrations: integrationList } = botImpl.definition

    const integrationsToUninstall: IntegrationInstances = _(botInfo.integrations)
      .keys()
      .filter((key) => !integrationList?.map((i) => i.id).includes(key))
      .zipObject()
      .mapValues(() => null)
      .value()

    const integrationsToInstall: IntegrationInstances = _(integrationList ?? [])
      .keyBy((i) => i.id)
      .mapValues(({ enabled, configuration }) => ({ enabled, configuration }))
      .value()

    return { ...integrationsToUninstall, ...integrationsToInstall }
  }

  protected displayWebhookUrls(bot: bpclient.Bot) {
    if (!_.keys(bot.integrations).length) {
      this.logger.debug('No integrations in bot')
      return
    }

    this.logger.log('Integrations:')
    for (const integration of Object.values(bot.integrations)) {
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
    integrationDef: IntegrationDefinition,
    argv: YargsConfig<typeof config.schemas.secrets>
  ): Promise<Record<string, string>> {
    const { secrets: secretDefinitions } = integrationDef
    if (!secretDefinitions) {
      return {}
    }

    const secretArgv = this._parseArgvSecrets(argv.secrets)
    const invalidSecret = Object.keys(secretArgv).find((s) => !secretDefinitions.includes(s))
    if (invalidSecret) {
      throw new errors.BotpressCLIError(`Secret ${invalidSecret} is not defined in integration definition`)
    }

    const values: Record<string, string> = {}
    for (const secretDef of secretDefinitions) {
      const argvSecret = secretArgv[secretDef]
      if (argvSecret) {
        this.logger.debug(`Using secret "${secretDef}" from argv`)
        values[secretDef] = argvSecret
        continue
      }

      const prompted = await this.prompt.text(`Enter value for secret "${secretDef}"`)
      if (!prompted) {
        throw new errors.BotpressCLIError('Secret is required')
      }
      values[secretDef] = prompted
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
}

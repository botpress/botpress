import type { YargsConfig } from '@bpinternal/yargs-extra'
import chalk from 'chalk'
import latestVersion from 'latest-version'
import _ from 'lodash'
import semver from 'semver'
import type { ApiClientFactory } from '../api/client'
import type * as config from '../config'
import * as consts from '../consts'
import * as errors from '../errors'
import type { CommandArgv, CommandDefinition } from '../typings'
import * as utils from '../utils'
import { BaseCommand } from './base-command'

export type GlobalCommandDefinition = CommandDefinition<typeof config.schemas.global>
export type GlobalCache = { apiUrl: string; token: string; workspaceId: string }

export type ConfigurableGlobalPaths = { botpressHomeDir: string; cliRootDir: utils.path.AbsolutePath }
export type ConstantGlobalPaths = typeof consts.fromHomeDir & typeof consts.fromCliRootDir
export type AllGlobalPaths = ConfigurableGlobalPaths & ConstantGlobalPaths

class GlobalPaths extends utils.path.PathStore<keyof AllGlobalPaths> {
  public constructor(argv: CommandArgv<GlobalCommandDefinition>) {
    const absBotpressHome = utils.path.absoluteFrom(utils.path.cwd(), argv.botpressHome)
    super({
      cliRootDir: consts.cliRootDir,
      botpressHomeDir: absBotpressHome,
      ..._.mapValues(consts.fromHomeDir, (p) => utils.path.absoluteFrom(absBotpressHome, p)),
      ..._.mapValues(consts.fromCliRootDir, (p) => utils.path.absoluteFrom(consts.cliRootDir, p)),
    })
  }
}

export abstract class GlobalCommand<C extends GlobalCommandDefinition> extends BaseCommand<C> {
  protected api: ApiClientFactory
  protected prompt: utils.prompt.CLIPrompt
  private _pkgJson: utils.pkgJson.PackageJson | undefined

  public constructor(
    api: ApiClientFactory,
    prompt: utils.prompt.CLIPrompt,
    ...args: ConstructorParameters<typeof BaseCommand<C>>
  ) {
    super(...args)
    this.api = api
    this.prompt = prompt
  }

  protected get globalPaths() {
    return new GlobalPaths(this.argv)
  }

  protected get globalCache() {
    return new utils.cache.FSKeyValueCache<GlobalCache>(this.globalPaths.abs.globalCacheFile)
  }

  protected override async bootstrap() {
    const pkgJson = await this.readPkgJson()
    const versionText = chalk.bold(`v${pkgJson.version}`)
    this.logger.log(`Botpress CLI ${versionText}`, { prefix: '🤖' })

    await this._notifyUpdateCli()

    const paths = this.globalPaths
    if (paths.abs.botpressHomeDir !== consts.defaultBotpressHome) {
      this.logger.log(`Using custom botpress home: ${paths.abs.botpressHomeDir}`, { prefix: '🏠' })
    }
  }

  protected override teardown = async () => {
    this.logger.cleanup()
  }

  protected async ensureLoginAndCreateClient(credentials: YargsConfig<typeof config.schemas.credentials>) {
    const cache = this.globalCache

    const token = await cache.get('token')
    const workspaceId = credentials.workspaceId ?? (await cache.get('workspaceId'))
    const apiUrl = credentials.apiUrl ?? (await cache.get('apiUrl'))

    if (!(token && workspaceId && apiUrl)) {
      throw new errors.NotLoggedInError()
    }

    if (apiUrl !== consts.defaultBotpressApiUrl) {
      this.logger.log(`Using custom url ${apiUrl}`, { prefix: '🔗' })
    }

    return this.api.newClient({ apiUrl, token, workspaceId }, this.logger)
  }

  private _notifyUpdateCli = async (): Promise<void> => {
    try {
      this.logger.debug('Checking if cli is up to date')

      const pkgJson = await this.readPkgJson()
      if (!pkgJson.version) {
        throw new errors.BotpressCLIError('Could not find version in package.json')
      }

      const latest = await latestVersion(pkgJson.name)
      const isOutdated = semver.lt(pkgJson.version, latest)
      if (isOutdated) {
        this.logger.box(
          [
            `${chalk.bold('Update available')} ${chalk.dim(pkgJson.version)} → ${chalk.green(latest)}`,
            '',
            'To update, run:',
            `  for npm  ${chalk.cyan(`npm i -g ${pkgJson.name}`)}`,
            `  for yarn ${chalk.cyan(`yarn global add ${pkgJson.name}`)}`,
            `  for pnpm ${chalk.cyan(`pnpm i -g ${pkgJson.name}`)}`,
          ].join('\n')
        )
      }
    } catch (thrown) {
      const err = errors.BotpressCLIError.map(thrown)
      this.logger.debug(`Failed to check if cli is up to date: ${err.message}`)
    }
  }

  protected async readPkgJson(): Promise<utils.pkgJson.PackageJson> {
    if (this._pkgJson) {
      return this._pkgJson
    }
    const { cliRootDir } = this.globalPaths.abs
    const pkgJson = await utils.pkgJson.readPackageJson(cliRootDir)
    if (!pkgJson) {
      throw new errors.BotpressCLIError(`Could not find package.json at "${cliRootDir}"`)
    }

    this._pkgJson = pkgJson
    return pkgJson
  }
}

import type { YargsConfig } from '@bpinternal/yargs-extra'
import chalk from 'chalk'
import fs from 'fs'
import latestVersion from 'latest-version'
import _ from 'lodash'
import * as pathlib from 'path'
import type { ApiClientFactory } from '../api-client'
import type * as config from '../config'
import * as consts from '../consts'
import * as errors from '../errors'
import type { CommandArgv, CommandDefinition } from '../typings'
import * as utils from '../utils'
import { BaseCommand } from './base-command'

export type GlobalCommandDefinition = CommandDefinition<typeof config.schemas.global>
export type GlobalCache = { host: string; token: string; workspaceId: string }

export type ConfigurableGlobalPaths = { botpressHomeDir: string; cliRootDir: utils.path.AbsolutePath }
export type ConstantGlobalPaths = typeof consts.fromHomeDir & typeof consts.fromCliRootDir
export type AllGlobalPaths = ConfigurableGlobalPaths & ConstantGlobalPaths

class GlobalPaths extends utils.path.PathStore<keyof AllGlobalPaths> {
  public constructor(argv: CommandArgv<GlobalCommandDefinition>) {
    const absBotpressHome = utils.path.absoluteFrom(utils.path.cwd(), argv.botpressHome)
    super({
      cliRootDir: argv.cliRootDir,
      botpressHomeDir: absBotpressHome,
      ..._.mapValues(consts.fromHomeDir, (p) => utils.path.absoluteFrom(absBotpressHome, p)),
      ..._.mapValues(consts.fromCliRootDir, (p) => utils.path.absoluteFrom(argv.cliRootDir, p)),
    })
  }
}

type PackageJson = { name: string; version: string }

const UPDATE_MSG = (props: PackageJson & { latest: string }) =>
  `${chalk.bold('Update available')} ${chalk.dim(props.version)} → ${chalk.green(props.latest)}

To update, run:
  for npm  ${chalk.cyan(`npm i -g ${props.name}`)}
  for yarn ${chalk.cyan(`yarn global add ${props.name}`)}
  for pnpm ${chalk.cyan(`pnpm i -g ${props.name}`)}`

export abstract class GlobalCommand<C extends GlobalCommandDefinition> extends BaseCommand<C> {
  protected api: ApiClientFactory
  protected prompt: utils.prompt.CLIPrompt

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

  protected override bootstrap = async () => {
    const pkgJson = await this._readPackageJson()

    const versionText = chalk.bold(`v${pkgJson.version}`)
    this.logger.log(`Botpress CLI ${versionText}`, { prefix: '🤖' })

    await this._notifyUpdate(pkgJson)

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
    const host = credentials.host ?? (await cache.get('host'))

    if (!(token && workspaceId && host)) {
      throw new errors.NotLoggedInError()
    }

    return this.api.newClient({ host, token, workspaceId }, this.logger)
  }

  private _notifyUpdate = async (pkgJson: PackageJson): Promise<void> => {
    try {
      const latest = await latestVersion(pkgJson.name)
      if (latest !== pkgJson.version) {
        this.logger.box(UPDATE_MSG({ ...pkgJson, latest }))
      }
    } catch (thrown) {
      const err = errors.BotpressCLIError.map(thrown)
      this.logger.debug(`Failed to check for updates: ${err.message}`)
    }
  }

  private _readPackageJson = async (): Promise<PackageJson> => {
    const path = pathlib.join(this.globalPaths.abs.cliRootDir, 'package.json')
    const strContent = await fs.promises.readFile(path, 'utf8')
    const jsonContent = JSON.parse(strContent)
    return jsonContent
  }
}

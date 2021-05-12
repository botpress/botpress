import * as sdk from 'botpress/sdk'
import { BotService } from 'core/bots'
import { GhostService } from 'core/bpfs'
import { CMSService } from 'core/cms'
import { BotpressConfig, ConfigProvider } from 'core/config'
import Database from 'core/database'
import { LoggerFilePersister, LoggerProvider } from 'core/logger'
import { copyDir } from 'core/misc/pkg-fs'
import { ModuleLoader } from 'core/modules'
import { AuthService } from 'core/security'
import { HintsService } from 'core/user-code'
import { WorkspaceService } from 'core/users'
import { WrapErrorsWith } from 'errors'
import fse from 'fs-extra'
import { inject, injectable, tagged } from 'inversify'
import joi from 'joi'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import _ from 'lodash'
import moment from 'moment'
import nanoid from 'nanoid'
import path from 'path'
import plur from 'plur'

import { setDebugScopes } from '../../debug'
import { HTTPServer } from './server'
import { TYPES } from './types'

export interface StartOptions {
  modules: sdk.ModuleEntryPoint[]
}

@injectable()
export class Botpress {
  botpressPath: string
  configLocation: string
  modulesConfig: any
  config!: BotpressConfig | undefined
  api!: typeof sdk
  _heartbeatTimer?: NodeJS.Timeout

  constructor(
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.Logger)
    @tagged('name', 'Server')
    private logger: sdk.Logger,
    @inject(TYPES.GhostService) private ghostService: GhostService,
    @inject(TYPES.HTTPServer) private httpServer: HTTPServer,
    @inject(TYPES.ModuleLoader) private moduleLoader: ModuleLoader,
    @inject(TYPES.HintsService) private hintsService: HintsService,
    @inject(TYPES.CMSService) private cmsService: CMSService,
    @inject(TYPES.LoggerProvider) private loggerProvider: LoggerProvider,
    @inject(TYPES.LoggerFilePersister) private loggerFilePersister: LoggerFilePersister,
    @inject(TYPES.WorkspaceService) private workspaceService: WorkspaceService,
    @inject(TYPES.AuthService) private authService: AuthService,
    @inject(TYPES.BotService) private botService: BotService
  ) {
    this.botpressPath = path.join(process.cwd(), 'dist')
    this.configLocation = path.join(this.botpressPath, '/config')
  }

  async start(options: StartOptions) {
    const beforeDt = moment()
    await this.initialize(options)
    const bootTime = moment().diff(beforeDt, 'milliseconds')
    this.logger.info(`Started in ${bootTime}ms`)
  }

  private async initialize(options: StartOptions) {
    this.config = await this.configProvider.getBotpressConfig()

    setDebugScopes(process.core_env.DEBUG || '')

    AppLifecycle.setDone(AppLifecycleEvents.CONFIGURATION_LOADED)

    await this.restoreDebugScope()
    await this.checkJwtSecret()
    await this.loadModules(options.modules)
    await this.initializeServices()
    await this.deployAssets()
    await this.startServer()
    await this.discoverBots()

    AppLifecycle.setDone(AppLifecycleEvents.BOTPRESS_READY)
  }

  async restoreDebugScope() {
    if (await this.ghostService.global().fileExists('/', 'debug.json')) {
      try {
        const { scopes } = await this.ghostService.global().readFileAsObject('/', 'debug.json')
        setDebugScopes(scopes.join(','))
      } catch (err) {
        this.logger.attachError(err).error("Couldn't load debug scopes. Check the syntax of debug.json")
      }
    }
  }

  async checkJwtSecret() {
    process.APP_SECRET = process.env.APP_SECRET || this.config?.appSecret!
  }

  async deployAssets() {
    try {
      const assets = path.resolve(process.PROJECT_LOCATION, 'data/assets')

      // Avoids overwriting the folder when developing locally on the studio
      if (fse.pathExistsSync(`${assets}/ui-studio/public`)) {
        const studioPath = fse.lstatSync(`${assets}/ui-studio/public`)
        if (studioPath.isSymbolicLink()) {
          return
        }
      }

      await copyDir(path.join(__dirname, '../../ui-studio'), `${assets}/ui-studio`)
    } catch (err) {
      this.logger.attachError(err).error('Error deploying assets')
    }
  }

  @WrapErrorsWith('Error while discovering bots')
  async discoverBots(): Promise<void> {
    await AppLifecycle.waitFor(AppLifecycleEvents.MODULES_READY)

    const bots = await this.botService.getBots()
    const botIds = [...bots.values()].map(b => b.id)

    const disabledBots = [...bots.values()].filter(b => b.disabled).map(b => b.id)
    const botsToMount = _.without(botIds, ...disabledBots)

    this.logger.info(
      `Discovered ${botsToMount.length} bot${botsToMount.length === 1 ? '' : 's'}${
        botsToMount.length ? `, mounting ${botsToMount.length === 1 ? 'it' : 'them'}...` : ''
      }`
    )

    const maxConcurrentMount = parseInt(process.env.MAX_CONCURRENT_MOUNT || '5')
    await Promise.map(botsToMount, botId => this.botService.mountBot(botId), { concurrency: maxConcurrentMount })
  }

  private async initializeServices() {
    await this.loggerFilePersister.initialize(this.config!, await this.loggerProvider('LogFilePersister'))

    await this.authService.initialize()
    await this.workspaceService.initialize()
    await this.cmsService.initialize()

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.hintsService.refreshAll()

    AppLifecycle.setDone(AppLifecycleEvents.SERVICES_READY)
  }

  private async loadModules(modules: sdk.ModuleEntryPoint[]): Promise<void> {
    const loadedModules = await this.moduleLoader.loadModules(modules)
    this.logger.info(`Loaded ${loadedModules.length} ${plur('module', loadedModules.length)}`)
  }

  private async startServer() {
    await this.httpServer.start()
    AppLifecycle.setDone(AppLifecycleEvents.HTTP_SERVER_READY)
  }
}

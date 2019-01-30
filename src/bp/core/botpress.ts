import * as sdk from 'botpress/sdk'
import { copyDir } from 'core/misc/pkg-fs'
import { WrapErrorsWith } from 'errors'
import fse from 'fs-extra'
import { inject, injectable, tagged } from 'inversify'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import _ from 'lodash'
import { Memoize } from 'lodash-decorators'
import moment from 'moment'
import nanoid from 'nanoid'
import path from 'path'
import plur from 'plur'

import { createForGlobalHooks } from './api'
import { BotpressConfig } from './config/botpress.config'
import { ConfigProvider } from './config/config-loader'
import Database from './database'
import { LoggerPersister, LoggerProvider } from './logger'
import { ModuleLoader } from './module-loader'
import HTTPServer from './server'
import { GhostService } from './services'
import { BotService } from './services/bot-service'
import { CMSService } from './services/cms'
import { converseApiEvents } from './services/converse'
import { DecisionEngine } from './services/dialog/decision-engine'
import { DialogEngine } from './services/dialog/dialog-engine'
import { ProcessingError } from './services/dialog/errors'
import { DialogJanitor } from './services/dialog/janitor'
import { SessionIdFactory } from './services/dialog/session/id-factory'
import { Hooks, HookService } from './services/hook/hook-service'
import { LogsJanitor } from './services/logs/janitor'
import { EventEngine } from './services/middleware/event-engine'
import { StateManager } from './services/middleware/state-manager'
import { NotificationsService } from './services/notification/service'
import RealtimeService from './services/realtime'
import { DataRetentionJanitor } from './services/retention/janitor'
import { DataRetentionService } from './services/retention/service'
import { WorkspaceService } from './services/workspace-service'
import { Statistics } from './stats'
import { TYPES } from './types'

export type StartOptions = {
  modules: sdk.ModuleEntryPoint[]
}

@injectable()
export class Botpress {
  botpressPath: string
  configLocation: string
  modulesConfig: any
  version: string
  config!: BotpressConfig | undefined
  api!: typeof sdk

  constructor(
    @inject(TYPES.Statistics) private stats: Statistics,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.Logger)
    @tagged('name', 'Server')
    private logger: sdk.Logger,
    @inject(TYPES.GhostService) private ghostService: GhostService,
    @inject(TYPES.HTTPServer) private httpServer: HTTPServer,
    @inject(TYPES.ModuleLoader) private moduleLoader: ModuleLoader,
    @inject(TYPES.HookService) private hookService: HookService,
    @inject(TYPES.RealtimeService) private realtimeService: RealtimeService,
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.CMSService) private cmsService: CMSService,
    @inject(TYPES.DialogEngine) private dialogEngine: DialogEngine,
    @inject(TYPES.DecisionEngine) private decisionEngine: DecisionEngine,
    @inject(TYPES.LoggerProvider) private loggerProvider: LoggerProvider,
    @inject(TYPES.DialogJanitorRunner) private dialogJanitor: DialogJanitor,
    @inject(TYPES.LogJanitorRunner) private logJanitor: LogsJanitor,
    @inject(TYPES.LoggerPersister) private loggerPersister: LoggerPersister,
    @inject(TYPES.NotificationsService) private notificationService: NotificationsService,
    @inject(TYPES.AppLifecycle) private lifecycle: AppLifecycle,
    @inject(TYPES.StateManager) private stateManager: StateManager,
    @inject(TYPES.DataRetentionJanitor) private dataRetentionJanitor: DataRetentionJanitor,
    @inject(TYPES.DataRetentionService) private dataRetentionService: DataRetentionService,
    @inject(TYPES.WorkspaceService) private workspaceService: WorkspaceService,
    @inject(TYPES.BotService) private botService: BotService
  ) {
    this.version = '12.0.1'
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
    this.trackStart()

    this.config = await this.loadConfiguration()
    await this.lifecycle.setDone(AppLifecycleEvents.CONFIGURATION_LOADED)

    await this.checkJwtSecret()
    await this.checkEditionRequirements()
    await this.createDatabase()
    await this.initializeGhost()
    await this.loadModules(options.modules)
    await this.initializeServices()
    await this.deployAssets()
    await this.startRealtime()
    await this.startServer()
    await this.discoverBots()

    this.api = await createForGlobalHooks()
    await this.hookService.executeHook(new Hooks.AfterServerStart(this.api))
  }

  async checkJwtSecret() {
    let jwtSecret = this.config!.jwtSecret
    if (!jwtSecret) {
      jwtSecret = nanoid(40)
      this.configProvider.mergeBotpressConfig({ jwtSecret })
      this.logger.warn(`JWT Secret isn't defined. Generating a random key...`)
    }

    process.JWT_SECRET = jwtSecret
  }

  async checkEditionRequirements() {
    const pro = _.get(this.config, 'pro.enabled', undefined)
    const redis = _.get(this.config, 'pro.redis.enabled', undefined)
    const postgres = this.config!.database.type.toLowerCase() === 'postgres'

    if (!pro && redis) {
      this.logger.warn(
        'Redis is enabled in your Botpress configuration. To use Botpress in a cluster, please upgrade to Botpress Pro.'
      )
    }
    if (pro && !redis) {
      this.logger.warn(
        'Redis has to be enabled to use Botpress in a cluster. Please enable it in your Botpress configuration file.'
      )
    }
    if (pro && !postgres && redis) {
      throw new Error(
        'Postgres is required to use Botpress in a cluster. Please migrate your database to Postgres and enable it in your Botpress configuration file.'
      )
    }
  }

  async deployAssets() {
    try {
      const assets = path.resolve(process.PROJECT_LOCATION, 'assets')
      await copyDir(path.join(__dirname, '../ui-admin'), `${assets}/ui-admin`)

      // Avoids overwriting the folder when developping locally on the studio
      if (fse.pathExistsSync(`${assets}/ui-studio/public`)) {
        const studioPath = await fse.lstatSync(`${assets}/ui-studio/public`)
        if (studioPath.isSymbolicLink()) {
          return
        }
      }

      await copyDir(path.join(__dirname, '../ui-studio'), `${assets}/ui-studio`)
    } catch (err) {
      this.logger.attachError(err).error('Error deploying assets')
    }
  }

  @WrapErrorsWith('Error while discovering bots')
  async discoverBots(): Promise<void> {
    const botsRef = await this.workspaceService.getBotRefs()
    const botsIds = await this.botService.getBotsIds()
    const unlinked = _.difference(botsIds, botsRef)

    if (unlinked.length) {
      this.logger.warn(
        `Some unlinked bots exist on your server, to enable them add them to workspaces.json [${unlinked.join(', ')}]`
      )
    }

    await Promise.map(botsRef, botId => this.botService.mountBot(botId))
  }

  @WrapErrorsWith('Error initializing Ghost Service')
  async initializeGhost(): Promise<void> {
    this.ghostService.initialize(process.IS_PRODUCTION)
    await this.ghostService.global().sync()
  }

  private async initializeServices() {
    await this.loggerPersister.initialize(this.database, await this.loggerProvider('LogPersister'))
    this.loggerPersister.start()

    await this.workspaceService.initialize()
    await this.cmsService.initialize()

    this.eventEngine.onBeforeIncomingMiddleware = async (event: sdk.IO.IncomingEvent) => {
      await this.hookService.executeHook(new Hooks.BeforeIncomingMiddleware(this.api, event))
    }

    this.eventEngine.onAfterIncomingMiddleware = async (event: sdk.IO.IncomingEvent) => {
      await this.hookService.executeHook(new Hooks.AfterIncomingMiddleware(this.api, event))
      const sessionId = SessionIdFactory.createIdFromEvent(event)
      await this.decisionEngine.processEvent(sessionId, event)
      await converseApiEvents.emitAsync(`done.${event.target}`, event)
    }

    this.dataRetentionService.initialize()
    this.stateManager.initialize()

    const dialogEngineLogger = await this.loggerProvider('DialogEngine')
    this.dialogEngine.onProcessingError = err => {
      const message = this.formatProcessingError(err)
      dialogEngineLogger.forBot(err.botId).warn(message)
    }

    this.notificationService.onNotification = notification => {
      const payload: sdk.RealTimePayload = {
        eventName: 'notifications.new',
        payload: notification
      }
      this.realtimeService.sendToSocket(payload)
    }

    await this.logJanitor.start()
    await this.dialogJanitor.start()

    if (this.config!.dataRetention) {
      await this.dataRetentionJanitor.start()
    }

    await this.lifecycle.setDone(AppLifecycleEvents.SERVICES_READY)
  }

  @Memoize()
  private async loadConfiguration(): Promise<BotpressConfig> {
    return this.configProvider.getBotpressConfig()
  }

  @WrapErrorsWith(`Error initializing Database. Please check your configuration`)
  private async createDatabase(): Promise<void> {
    await this.database.initialize(this.config!.database)
  }

  private async loadModules(modules: sdk.ModuleEntryPoint[]): Promise<void> {
    const loadedModules = await this.moduleLoader.loadModules(modules)
    this.logger.info(`Loaded ${loadedModules.length} ${plur('module', loadedModules.length)}`)
  }

  private async startServer() {
    await this.httpServer.start()
    this.lifecycle.setDone(AppLifecycleEvents.HTTP_SERVER_READY)
  }

  private startRealtime() {
    this.realtimeService.installOnHttpServer(this.httpServer.httpServer)
  }

  private formatProcessingError(err: ProcessingError) {
    return `Error processing "${err.instruction}"
Err: ${err.message}
Flow: ${err.flowName}
Node: ${err.nodeName}`
  }

  private trackStart() {
    this.stats.track(
      'server',
      'start',
      `isProEnabled: ${process.IS_PRO_ENABLED}; version: ${process.BOTPRESS_VERSION}; licensed: ${process.IS_LICENSED}`
    )
  }
}

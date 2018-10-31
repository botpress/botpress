import * as sdk from 'botpress/sdk'
import { WellKnownFlags } from 'core/sdk/enums'
import { inject, injectable, tagged } from 'inversify'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import { Memoize } from 'lodash-decorators'
import moment from 'moment'
import nanoid from 'nanoid'
import path from 'path'
import plur from 'plur'

import ProxyUI from '../http/api'

import { createForGlobalHooks } from './api'
import { BotLoader } from './bot-loader'
import { BotpressConfig } from './config/botpress.config'
import { ConfigProvider } from './config/config-loader'
import Database from './database'
import { LoggerPersister, LoggerProvider } from './logger'
import { ModuleLoader } from './module-loader'
import HTTPServer from './server'
import { GhostService } from './services'
import { CMSService } from './services/cms/cms-service'
import { DialogEngineV2, ProcessingError } from './services/dialog/engine-v2'
import { DialogJanitor } from './services/dialog/janitor'
import { SessionIdFactory } from './services/dialog/session/id-factory'
import { Hooks, HookService } from './services/hook/hook-service'
import { LogsJanitor } from './services/logs/janitor'
import { EventEngine } from './services/middleware/event-engine'
import { NotificationsService } from './services/notification/service'
import RealtimeService from './services/realtime'
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
    @inject(TYPES.ProxyUI) private proxyUi: ProxyUI,
    @inject(TYPES.ModuleLoader) private moduleLoader: ModuleLoader,
    @inject(TYPES.BotLoader) private botLoader: BotLoader,
    @inject(TYPES.HookService) private hookService: HookService,
    @inject(TYPES.RealtimeService) private realtimeService: RealtimeService,
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.CMSService) private cmsService: CMSService,
    @inject(TYPES.DialogEngine) private dialogEngine: DialogEngineV2,
    @inject(TYPES.LoggerProvider) private loggerProvider: LoggerProvider,
    @inject(TYPES.DialogJanitorRunner) private dialogJanitor: DialogJanitor,
    @inject(TYPES.LogJanitorRunner) private logJanitor: LogsJanitor,
    @inject(TYPES.LoggerPersister) private loggerPersister: LoggerPersister,
    @inject(TYPES.NotificationsService) private notificationService: NotificationsService,
    @inject(TYPES.AppLifecycle) private lifecycle: AppLifecycle
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
    this.stats.track('server', 'starting')
    this.config = await this.loadConfiguration()

    await this.checkJwtSecret()
    await this.createDatabase()
    await this.initializeGhost()
    await this.initializeServices()
    await this.loadModules(options.modules)
    await this.startRealtime()
    await this.startServer()
    await this.startProxy()
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

  async discoverBots(): Promise<void> {
    await this.botLoader.loadAllBots()

    const botIds = await this.botLoader.getAllBotIds()
    for (const bot of botIds) {
      await this.botLoader.mountBot(bot)
    }
  }

  async initializeGhost(): Promise<void> {
    await this.ghostService.initialize(this.config!)
    await this.ghostService.global().sync(['actions', 'content-types', 'hooks'])
  }

  private async initializeServices() {
    await this.loggerPersister.initialize(this.database, await this.loggerProvider('LogPersister'))
    this.loggerPersister.start()

    await this.cmsService.initialize()

    this.eventEngine.onBeforeIncomingMiddleware = async (event: sdk.IO.Event) => {
      await this.hookService.executeHook(new Hooks.BeforeIncomingMiddleware(this.api, event))
    }

    this.eventEngine.onAfterIncomingMiddleware = async (event: sdk.IO.Event) => {
      await this.hookService.executeHook(new Hooks.AfterIncomingMiddleware(this.api, event))
      if (!event.hasFlag(WellKnownFlags.SKIP_DIALOG_ENGINE)) {
        const sessionId = SessionIdFactory.createIdFromEvent(event)
        await this.dialogEngine.processEvent(sessionId, event)
      }
    }

    const flowLogger = await this.loggerProvider('DialogEngine')
    this.dialogEngine.onProcessingError = err => {
      const message = this.formatError(err)
      flowLogger.forBot(err.botId).warn(message)
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

    await this.lifecycle.setDone(AppLifecycleEvents.SERVICES_READY)
  }

  @Memoize()
  private async loadConfiguration(): Promise<BotpressConfig> {
    return this.configProvider.getBotpressConfig()
  }

  private async createDatabase(): Promise<void> {
    await this.database.initialize(this.config!.database)
  }

  private async loadModules(modules: sdk.ModuleEntryPoint[]): Promise<void> {
    const loadedModules = await this.moduleLoader.loadModules(modules)
    this.logger.info(`Loaded ${loadedModules.length} ${plur('module', loadedModules.length)}`)
  }

  private async startServer() {
    await this.httpServer.start()
  }

  private async startProxy() {
    await this.proxyUi.start()
    this.lifecycle.setDone(AppLifecycleEvents.HTTP_SERVER_READY)
  }

  private startRealtime() {
    this.realtimeService.installOnHttpServer(this.httpServer.httpServer)
  }

  private formatError(err: ProcessingError) {
    return `Error processing "${err.instruction}"
Err: ${err.message}
Flow: ${err.flowName}
Node: ${err.nodeName}`
  }
}

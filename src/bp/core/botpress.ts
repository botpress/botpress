import * as sdk from 'botpress/sdk'
import { WellKnownFlags } from 'core/sdk/enums'
import { inject, injectable, tagged } from 'inversify'
import { Memoize } from 'lodash-decorators'
import moment from 'moment'
import path from 'path'
import plur from 'plur'

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
import { DialogEngine, ProcessingError } from './services/dialog/engine'
import { DialogJanitor } from './services/dialog/janitor'
import { Hooks, HookService } from './services/hook/hook-service'
import { LogsJanitor } from './services/logs/janitor'
import { EventEngine } from './services/middleware/event-engine'
import { NotificationsService } from './services/notification/service'
import RealtimeService from './services/realtime'
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
  config: BotpressConfig | undefined
  api!: typeof sdk

  constructor(
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.Logger)
    @tagged('name', 'Server')
    private logger: sdk.Logger,
    @inject(TYPES.GhostService) private ghostService: GhostService,
    @inject(TYPES.HTTPServer) private httpServer: HTTPServer,
    @inject(TYPES.ModuleLoader) private moduleLoader: ModuleLoader,
    @inject(TYPES.BotLoader) private botLoader: BotLoader,
    @inject(TYPES.HookService) private hookService: HookService,
    @inject(TYPES.RealtimeService) private realtimeService: RealtimeService,
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.CMSService) private cmsService: CMSService,
    @inject(TYPES.DialogEngine) private dialogEngine: DialogEngine,
    @inject(TYPES.LoggerProvider) private loggerProvider: LoggerProvider,
    @inject(TYPES.DialogJanitorRunner) private dialogJanitor: DialogJanitor,
    @inject(TYPES.LogJanitorRunner) private logJanitor: LogsJanitor,
    @inject(TYPES.LoggerPersister) private loggerPersister: LoggerPersister,
    @inject(TYPES.NotificationsService) private notificationService: NotificationsService
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
    this.config = await this.loadConfiguration()

    await this.trackStats()
    await this.createDatabase()
    await this.initializeGhost()
    await this.initializeServices()
    await this.loadModules(options.modules)
    await this.startRealtime()
    await this.startServer()

    this.api = await createForGlobalHooks()
    await this.hookService.executeHook(new Hooks.AfterBotStart(this.api))
  }

  async initializeGhost(): Promise<void> {
    await this.ghostService.initialize(this.config!)
    await this.ghostService.global().sync(['actions', 'content-types', 'hooks'])

    const botIds = await this.botLoader.getAllBotIds()
    for (const bot of botIds) {
      await this.ghostService.forBot(bot).sync(['actions', 'content-elements', 'flows'])
    }
  }

  private async initializeServices() {
    await this.loggerPersister.initialize(this.database, await this.loggerProvider('LogPersister'))
    this.loggerPersister.start()

    await this.cmsService.initialize()
    await this.botLoader.loadAllBots()

    this.eventEngine.onAfterIncomingMiddleware = async (event: sdk.IO.Event) => {
      await this.hookService.executeHook(new Hooks.AfterIncomingMiddleware(this.api, event))
      if (!event.hasFlag(WellKnownFlags.SKIP_DIALOG_ENGINE)) {
        await this.dialogEngine.processEvent(event)
      }
    }

    const flowLogger = await this.loggerProvider('DialogEngine')
    this.dialogEngine.onProcessingError = err => {
      const message = this.formatError(err)
      flowLogger.forBot(err.botId).warn(message)
    }

    this.notificationService.onNotification = () => {
      const payload: sdk.RealTimePayload = {
        eventName: 'notification.new',
        payload: {} // pass notification here? or just notify the client to fetch the new notifications via the http api?
      }
      this.realtimeService.sendToSocket(payload)
    }

    await this.logJanitor.start()
    await this.dialogJanitor.start()
  }

  @Memoize()
  private async loadConfiguration(): Promise<BotpressConfig> {
    return this.configProvider.getBotpressConfig()
  }

  private async trackStats(): Promise<void> {
    // TODO
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

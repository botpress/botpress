import { BotpressAPI, BotpressEvent, DialogAPI, ModuleDefinition, WellKnownEventFlags } from 'botpress-module-sdk'
import { Logger } from 'botpress-module-sdk'
import { inject, injectable, tagged } from 'inversify'
import { Memoize } from 'lodash-decorators'
import moment from 'moment'
import * as path from 'path'
import plur from 'plur'

import packageJson from '../package.json'

import { createForGlobalHooks } from './api'
import { BotLoader } from './bot-loader'
import { BotpressConfig } from './config/botpress.config'
import { ConfigProvider } from './config/config-loader'
import Database from './database'
import { TYPES } from './misc/types'
import { ModuleLoader } from './module-loader'
import HTTPServer from './server'
import { DialogEngine } from './services/dialog/engine'
import { Janitor } from './services/dialog/janitor'
import GhostService from './services/ghost/service'
import { Hooks, HookService } from './services/hook/hook-service'
import { EventEngine } from './services/middleware/event-engine'
import RealtimeService from './services/realtime'
import { LoggerProvider } from './Logger'

export type StartOptions = {
  modules: Map<string, ModuleDefinition>
}

@injectable()
export class Botpress {
  botpressPath: string
  configLocation: string
  modulesConfig: any
  version: string
  config: BotpressConfig | undefined
  api!: BotpressAPI

  constructor(
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.Logger)
    @tagged('name', 'Server')
    private logger: Logger,
    @inject(TYPES.GhostService) private ghostService: GhostService,
    @inject(TYPES.HTTPServer) private httpServer: HTTPServer,
    @inject(TYPES.ModuleLoader) private moduleLoader: ModuleLoader,
    @inject(TYPES.BotLoader) private botLoader: BotLoader,
    @inject(TYPES.HookService) private hookService: HookService,
    @inject(TYPES.RealtimeService) private realtimeService: RealtimeService,
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.DialogEngine) private dialogEngine: DialogEngine,
    @inject(TYPES.LoggerProvider) private loggerProvider: LoggerProvider,
    @inject(TYPES.Janitor) private janitor: Janitor
  ) {
    this.version = packageJson.version
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
    // Global
    await this.ghostService.global().addRootFolder('/config', { filesGlob: '*.json' })
    await this.ghostService.global().addRootFolder('/hooks', { filesGlob: '**/*.js' })
    await this.ghostService.global().addRootFolder('/actions', { filesGlob: '**/*.js' })
    await this.ghostService.global().addRootFolder('/content-types', { filesGlob: '*.js' })
    // Bot-specific
    await this.ghostService.forAllBots().addRootFolder('/', { filesGlob: '*.json' })
    await this.ghostService.forAllBots().addRootFolder('/actions', { filesGlob: '**/*.js' })
    await this.ghostService.forAllBots().addRootFolder('/flows', { filesGlob: '**/*.json' })
    await this.ghostService.forAllBots().addRootFolder('/config', { filesGlob: '*.json' })
    await this.ghostService.forAllBots().addRootFolder('/content-elements', { filesGlob: '*.json' })
    await this.ghostService.forAllBots().addRootFolder('/media', { filesGlob: '*.*', isBinary: true })
  }

  private async initializeServices() {
    await this.botLoader.loadAllBots()
    this.eventEngine.onAfterIncomingMiddleware = async (event: BotpressEvent) => {
      await this.hookService.executeHook(new Hooks.AfterIncomingMiddleware(this.api, event))
      if (!event.hasFlag(WellKnownEventFlags.SKIP_DIALOG_ENGINE)) {
        const sessionId = `${event.channel}::${event.target}::${event.threadId}`
        await this.dialogEngine.processEvent(event.botId, sessionId, event)
      }
    }

    const flowLoger = await this.loggerProvider('DialogEngine')
    this.dialogEngine.onProcessingError = err => {
      const message = `Error processing "${err.instruction}"
Err: ${err.message}
Flow: ${err.flowName}
Node: ${err.nodeName}`
      flowLoger.warn(message)
    }

    this.janitor.install()
  }

  @Memoize()
  private async loadConfiguration(): Promise<BotpressConfig> {
    return this.configProvider.getBotpressConfig()
  }

  private async trackStats(): Promise<void> {
    // TODO
  }

  private createDatabase(): Promise<void> {
    return this.database.initialize(this.config!.database)
  }

  private async loadModules(modules: Map<string, ModuleDefinition>): Promise<void> {
    const loadedModules = await this.moduleLoader.loadModules(modules)
    this.logger.info(`Loaded ${loadedModules.length} ${plur('module', loadedModules.length)}`)
  }

  private async startServer() {
    await this.httpServer.start()
  }

  private startRealtime() {
    this.realtimeService.installOnHttpServer(this.httpServer.httpServer)
  }
}

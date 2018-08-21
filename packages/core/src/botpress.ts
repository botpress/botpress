import { ModuleDefinition } from 'botpress-module-sdk'
import { inject, injectable, tagged } from 'inversify'
import { Memoize } from 'lodash-decorators'
import moment from 'moment'
import * as path from 'path'

import packageJson from '../package.json'

import { BotLoader } from './bot-loader'
import { BotpressConfig } from './config/botpress.config'
import { ConfigProvider } from './config/config-loader'
import Database from './database'
import { Logger } from './misc/interfaces'
import { TYPES } from './misc/types'
import { ModuleLoader } from './module-loader'
import HTTPServer from './server'
import { CMSService } from './services/cms/cms-service'
import { DialogEngine } from './services/dialog/engine'
import { DialogProcessor } from './services/dialog/processor'
import { HookService } from './services/hook/hook-service'

export type StartOptions = {
  modules: any[]
}

@injectable()
export class Botpress {
  botpressPath: string
  configLocation: string
  modulesConfig: any
  version: string
  config: BotpressConfig | undefined

  constructor(
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.CMSService) private cmsService: CMSService,
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.DialogEngine) private dialogEngine: DialogEngine,
    @inject(TYPES.Logger)
    @tagged('name', 'Server')
    private logger: Logger,
    @inject(TYPES.HTTPServer) private httpServer: HTTPServer,
    @inject(TYPES.ModuleLoader) private moduleLoader: ModuleLoader,
    @inject(TYPES.BotLoader) private botLoader: BotLoader,
    @inject(TYPES.HookService) private hookService: HookService
  ) {
    this.version = packageJson.version
    this.botpressPath = path.join(process.cwd(), 'dist')
    this.configLocation = path.join(this.botpressPath, '/config')
  }

  async start(options: StartOptions = { modules: [] }) {
    const beforeDt = moment()
    await this.initialize(options)
    const bootTime = moment().diff(beforeDt, 'milliseconds')
    this.logger.info(`Started in ${bootTime}ms`)
  }

  private async initialize(options: StartOptions) {
    this.config = await this.loadConfiguration()

    await this.trackStats()
    await this.createDatabase()
    await this.initializeServices()
    await this.loadModules(options.modules)
    await this.startServer()

    await this.hookService.executeHook('after_bot_start')
  }

  private async initializeServices() {
    await this.cmsService.initialize()
    await this.botLoader.loadAllBots()
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

  private async loadModules(modules: ModuleDefinition[]): Promise<void> {
    const loadedModules = await this.moduleLoader.loadModules(modules)
    this.logger.info(`Loaded ${loadedModules.length} modules`)
  }

  private async startServer() {
    await this.httpServer.start()
  }
}

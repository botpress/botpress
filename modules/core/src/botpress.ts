import * as path from 'path'
import { ModuleLoader } from './module-loader'
import packageJson from '../package.json'
import { inject, injectable } from 'inversify'
import { TYPES } from './misc/types'
import HTTPServer from './server'
import Database from './database'
import { ConfigProvider } from './config-loader'
import { Memoize } from 'lodash-decorators'
import { BotpressConfig } from './botpress.config'

@injectable()
export class Botpress {
  projectLocation: string
  botpressPath: string
  configLocation: string

  modulesConfig: any
  version: string
  config: BotpressConfig

  constructor(
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.HTTPServer) private httpServer: HTTPServer,
    @inject(TYPES.ModuleLoader) private moduleLoader: ModuleLoader
  ) {
    this.version = packageJson.version
    this.botpressPath = path.join(process.cwd(), 'dist')
    this.configLocation = path.join(this.botpressPath, '/config')
  }

  start() {
    this.initialize()
  }

  private async initialize() {
    this.config = await this.loadConfiguration()

    this.trackStats()
    this.createDatabase()
    this.loadModules()
    this.startServer()
  }

  @Memoize()
  private async loadConfiguration(): Promise<BotpressConfig> {
    return this.configProvider.getBotpressConfig()
  }

  private trackStats(): any {
    // TODO
  }

  private createDatabase() {
    this.database.initialize({
      type: this.config.database.type,
      location: this.config.database.location,
      host: this.config.database.host,
      port: this.config.database.port,
      user: this.config.database.user,
      password: this.config.database.password,
      database: this.config.database.database
    })
  }

  private loadModules() {
    setInterval(async () => {
      const modules = await this.moduleLoader.getAvailableModules()
      console.log(modules)
    }, 5000)
  }

  private async startServer() {
    await this.httpServer.start()
  }
}

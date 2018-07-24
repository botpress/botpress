import * as path from 'path'
import * as fs from 'fs'
import { ModuleLoader } from './module-loader'
import packageJson from '../package.json'
import { inject, injectable, tagged } from 'inversify'
import { TYPES } from './misc/types'
import { Logger } from './misc/interfaces'

const MODULES_CONFIG_PATH = '/modules.config.json'

@injectable()
export class Botpress {
  projectLocation: string
  botpressPath: string
  configLocation: string

  moduleLoader: ModuleLoader
  modulesConfig: any
  version: string
  logger: Logger

  constructor(@inject(TYPES.ModuleLoader) moduleLoader: ModuleLoader, @inject(TYPES.Logger) @tagged('name', 'Botpress') logger: Logger) {
    this.moduleLoader = moduleLoader
    this.logger = logger
    this.version = packageJson.version
    this.botpressPath = path.join(__dirname, '../')
    this.configLocation = path.join(this.botpressPath, '/config')
    console.log(this.botpressPath, this.configLocation)
  }

  private initialize() {
    this.trackStats()
    this.createDatabase()
    this.loadModules()
  }

  private trackStats(): any {
    // TODO
  }

  private createDatabase(): any {
    // TODO
  }

  private loadModules() {
    fs.readFile(path.join(this.configLocation, MODULES_CONFIG_PATH), 'utf8', (error, data) => {
      if (!data || error) {
        console.error('Could not read from Botpress configuration files')
        return
      }

      this.modulesConfig = JSON.parse(data)
      this.modulesConfig.modules.forEach((module: any) => this.moduleLoader.loadModule(module))
    })
  }

  start() {
    this.initialize()
  }
}

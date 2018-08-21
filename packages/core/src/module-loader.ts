import { ModuleDefinition, ModuleMetadata } from 'botpress-module-sdk'
import fs from 'fs-extra'
import { inject, injectable, tagged } from 'inversify'
import { Memoize } from 'lodash-decorators'
import path from 'path'

import { ConfigProvider } from './config/config-loader'
import { ModuleConfig } from './config/module.config'
import { ModuleConfigEntry, ModulesConfig } from './config/modules.config'
import { Logger } from './misc/interfaces'
import { TYPES } from './misc/types'

export type AvailableModule = {
  metadata: ModuleMetadata
  definition: ModuleConfigEntry
}

@injectable()
export class ModuleLoader {
  private loadedModules = []

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'ModuleLoader')
    private logger: Logger,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.ProjectLocation) private projectLocation: string
  ) {}

  private async loadConfiguration(): Promise<ModulesConfig> {
    return this.configProvider.getModulesConfig()
  }

  private async alertUnavailableModule(moduleUrl: string) {
    this.logger.warn(`Module at "${moduleUrl}" is not available`)
  }

  public async loadModules(modules: ModuleDefinition[]) {
    for (const module of modules) {
      await (module.onInit && module.onInit())
    }
    for (const module of modules) {
      await (module.onReady && module.onReady())
    }
    return []
  }

  @Memoize()
  public async loadEnabledModules() {
    const config = await this.loadConfiguration()

    const modules = new Map<string, ModuleMetadata>()

    for (const module of config.modules.filter(m => m.enabled)) {
      if (modules.has(module.name)) {
        throw new Error(`There's already a module "${module.name}" registered`)
      }

      const moduleFolder = path.resolve(this.projectLocation, 'modules', module.name)
      const moduleConfig = await this.getModuleConfig(moduleFolder)

      const initFile = path.resolve(moduleFolder, 'main.js')
      if (!fs.existsSync(initFile)) {
        throw new Error(`Module init file not found at "${initFile}"`)
      }

      const moduleInit = eval('require(initFile)') // Eval so that "pkg" doesn't bundle it
      console.log('===> Module ' + module.name + ' loaded', moduleInit)

      this.logger.info(`Loaded "${module.name}" (v${moduleConfig.version})`)

      this.alertUnavailableModule(module.name)
    }
  }

  private async getModuleConfig(moduleFolder: string) {
    const moduleConfigFile = path.join(moduleFolder, 'module.config.json')
    if (!fs.existsSync(moduleConfigFile)) {
      throw new Error(`Invalid module, necessary file "${moduleConfigFile}" not found`)
    }
    const content = await fs.readJSON(moduleConfigFile, { throws: false, encoding: 'utf8' })
    if (!content || !content.version) {
      throw new Error(`Invalid module definition "${moduleConfigFile}"`)
    }
    return <ModuleConfig>content
  }

  @Memoize()
  public async getAvailableModules(): Promise<AvailableModule[]> {
    await this.loadEnabledModules()
    return this.loadedModules
  }
}

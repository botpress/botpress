import { ModuleDefinition, ModuleMetadata } from 'botpress-module-sdk'
import { Logger } from 'botpress-module-sdk'
import { EFAULT } from 'constants'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import { Memoize } from 'lodash-decorators'

import { createForModule } from './api'
import { ModuleConfigEntry } from './config/modules.config'
import { TYPES } from './misc/types'
import GhostService from './services/ghost/service'
import ConfigReader from './services/module/config-reader'

export type AvailableModule = {
  metadata: ModuleMetadata
  definition: ModuleConfigEntry
}

@injectable()
export class ModuleLoader {
  private loadedModules = new Map<string, ModuleDefinition>()
  private _configReader?: ConfigReader

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'ModuleLoader')
    private logger: Logger,
    @inject(TYPES.GhostService) private ghost: GhostService
  ) {}

  public get configReader() {
    if (this._configReader) {
      return this._configReader
    }

    throw new Error('Configuration reader is not initialized (you need to load modules first)')
  }

  public set configReader(value: ConfigReader) {
    if (this._configReader) {
      throw new Error('Modules have already been loaded')
    }

    this._configReader = value
  }

  public async loadModules(modules: Map<string, ModuleDefinition>) {
    this.configReader = new ConfigReader(this.logger, modules, this.ghost)
    await this.configReader.initialize()
    const initedModules = {}
    const readyModules: string[] = []

    for (const [name, module] of modules) {
      try {
        const api = await createForModule(name)
        await (module.onInit && module.onInit(api))
        initedModules[name] = true
      } catch (err) {
        this.logger.error(`Error during module "${name}" init`, err)
      }
    }

    // Once all the modules have been loaded, we tell them it's ready
    // TODO We probably want to wait until Botpress is done loading the other services etc
    for (const [name, module] of modules) {
      if (!initedModules[name]) {
        this.logger.warn(`Module "${name}" skipped`)
        continue
      }

      try {
        const api = await createForModule(name)
        await (module.onReady && module.onReady(api))
        readyModules.push(name)
        this.loadedModules.set(name.toLowerCase(), module)
      } catch (err) {
        this.logger.error(`Error during module "${name}" ready. Module will still be loaded.`, err)
      }
    }

    return readyModules
  }

  public getModuleFile(module: string, path: string): Promise<Buffer> {
    module = module.toLowerCase()
    if (!this.loadedModules.has(module)) {
      throw new Error(`Module "${module}" not registered`)
    }

    const def = this.loadedModules.get(module)!

    if (typeof def.serveFile !== 'function') {
      throw new Error(`Module "${module} does not support serving files"`)
    }

    return def.serveFile!(path)
  }
}

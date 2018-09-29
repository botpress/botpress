import { Logger, ModuleDefinition, ModuleEntryPoint } from 'botpress/sdk'
import { ValidationError } from 'errors'
import { inject, injectable, tagged } from 'inversify'
import joi from 'joi'
import _ from 'lodash'

import { createForModule } from './api' // TODO
import { GhostService } from './services'
import ConfigReader from './services/module/config-reader'
import { TYPES } from './types'

const MODULE_SCHEMA = joi.object().keys({
  onInit: joi.func().required(),
  onReady: joi.func().required(),
  config: joi.object().optional(),
  defaultConfigJson: joi.string().optional(),
  serveFile: joi.func().optional(),
  definition: joi.object().keys({
    name: joi.string().required(),
    fullName: joi.string().optional(),
    plugins: joi
      .array()
      .optional()
      .default([]),
    noInterface: joi
      .boolean()
      .optional()
      .default(false),
    moduleView: joi
      .object()
      .optional()
      .keys({
        stretched: joi.boolean().default(false)
      }),
    menuIcon: joi.string().optional(),
    menuText: joi.string().optional(),
    homepage: joi.string().optional()
  })
})

@injectable()
export class ModuleLoader {
  private entryPoints = new Map<string, ModuleEntryPoint>()
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

  public static processModuleEntryPoint(module: ModuleEntryPoint, name: string): ModuleEntryPoint {
    const ret = MODULE_SCHEMA.validate(module, { abortEarly: false })

    if (ret.error) {
      const message = (name.length ? `Module "${name}" has` : '') + 'invalid configuration'
      throw new ValidationError(ret.error, message)
    }

    const definition: Partial<ModuleDefinition> = {
      fullName: module.definition.name,
      menuIcon: 'view_module',
      menuText: module.definition.name,
      moduleView: { stretched: false },
      noInterface: false,
      plugins: []
    }

    return _.merge({ definition }, ret.value)
  }

  public async loadModules(modules: ModuleEntryPoint[]) {
    this.configReader = new ConfigReader(this.logger, modules, this.ghost)
    await this.configReader.initialize()
    const initedModules = {}
    const readyModules: string[] = []

    for (const module of modules) {
      try {
        const name = _.get(module, 'definition.name', '').toLowerCase()
        ModuleLoader.processModuleEntryPoint(module, name)
        const api = await createForModule(name)
        await (module.onInit && module.onInit(api))
        initedModules[name] = true
      } catch (err) {
        this.logger.error('Error during module', err)
      }
    }

    // Once all the modules have been loaded, we tell them it's ready
    // TODO We probably want to wait until Botpress is done loading the other services etc
    for (const module of modules) {
      const name = module.definition.name.toLowerCase()
      if (!initedModules[name]) {
        this.logger.warn(`Module "${name}" skipped`)
        continue
      }

      try {
        const api = await createForModule(name)
        await (module.onReady && module.onReady(api))
        readyModules.push(name)
        this.entryPoints.set(name, module)
      } catch (err) {
        this.logger.error(`Error during module "${name}" ready. Module will still be loaded.`, err)
      }
    }

    return readyModules
  }

  public getModuleFile(module: string, path: string): Promise<Buffer> {
    module = module.toLowerCase()
    if (!this.entryPoints.has(module)) {
      throw new Error(`Module "${module}" not registered`)
    }

    const def = this.entryPoints.get(module)!

    if (typeof def.serveFile !== 'function') {
      throw new Error(`Module "${module} does not support serving files"`)
    }

    return def.serveFile!(path)
  }

  public getLoadedModules(): ModuleDefinition[] {
    const definitions = Array.from(this.entryPoints.values()).map(x => x.definition)
    return definitions
  }
}

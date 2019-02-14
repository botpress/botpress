import { BotTemplate, Flow, Logger, ModuleDefinition, ModuleEntryPoint, Skill } from 'botpress/sdk'
import { ValidationError } from 'errors'

import { inject, injectable, tagged } from 'inversify'
import joi from 'joi'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import _ from 'lodash'

import { createForModule } from './api' // TODO

import { GhostService } from './services'
import ConfigReader from './services/module/config-reader'
import { ModuleResourceLoader } from './services/module/resources-loader'
import { TYPES } from './types'

const MODULE_SCHEMA = joi.object().keys({
  onServerStarted: joi.func().required(),
  onServerReady: joi.func().required(),
  onBotMount: joi.func().optional(),
  onBotUnmount: joi.func().optional(),
  onFlowChanged: joi.func().optional(),
  skills: joi.array().optional(),
  botTemplates: joi.array().optional(),
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
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.AppLifecycle) private lifecycle: AppLifecycle
  ) { }

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

  // FIXME: Load modules for bots using onBotMount instead of init
  public async loadModules(modules: ModuleEntryPoint[]) {
    this.configReader = new ConfigReader(this.logger, modules, this.ghost)
    await this.configReader.initialize()
    const initedModules = {}

    for (const module of modules) {
      const name = _.get(module, 'definition.name', '').toLowerCase()
      try {
        ModuleLoader.processModuleEntryPoint(module, name)
        const api = await createForModule(name)
        await (module.onServerStarted && module.onServerStarted(api))
        initedModules[name] = true
        this.entryPoints.set(name, module)

        const resourceLoader = new ModuleResourceLoader(this.logger, name, this.ghost)
        await resourceLoader.importResources()
      } catch (err) {
        this.logger.attachError(err).error(`Error in module "${name}" onServerStarted`)
      }
    }

    this.callModulesOnReady(modules, initedModules) // Floating promise here is on purpose, we are doing this in background
    return Object.keys(initedModules)
  }

  public async unloadModulesForBot(botId: string) {
    const modules = this.getLoadedModules()
    for (const module of modules) {
      const entryPoint = this.getModule(module.name)
      const api = await createForModule(module.name)
      await (entryPoint.onBotUnmount && entryPoint.onBotUnmount(api, botId))
    }
  }

  public async onFlowChanged(botId: string, flow: Flow) {
    const modules = this.getLoadedModules()
    for (const module of modules) {
      const entryPoint = this.getModule(module.name)
      const api = await createForModule(module.name)
      await (entryPoint.onFlowChanged && entryPoint.onFlowChanged(api, botId, flow))
    }
  }

  private async callModulesOnReady(modules: ModuleEntryPoint[], initedModules: {}): Promise<void> {
    await this.lifecycle.waitFor(AppLifecycleEvents.HTTP_SERVER_READY)

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
        await (module.onServerReady && module.onServerReady(api))
      } catch (err) {
        this.logger.warn(`Error in module "${name}" 'onServerReady'. Module will still be loaded. Err: ${err.message}`)
      }
    }
  }

  public async loadModulesForBot(botId: string) {
    const modules = this.getLoadedModules()
    for (const module of modules) {
      const entryPoint = this.getModule(module.name)
      const api = await createForModule(module.name)
      await (entryPoint.onBotMount && entryPoint.onBotMount(api, botId))
    }
  }

  public getBotTemplates(): BotTemplate[] {
    const templates = Array.from(this.entryPoints.values())
      .filter(module => module.botTemplates)
      .map(module => {
        return module.botTemplates!.map(template => {
          return { ...template, moduleId: module.definition.name, moduleName: module.definition.fullName }
        })
      })

    return _.flatten(templates)
  }

  public getLoadedModules(): ModuleDefinition[] {
    return Array.from(this.entryPoints.values()).map(x => x.definition)
  }

  public async getFlowGenerator(moduleName, skillId): Promise<any> {
    const module = this.getModule(moduleName)
    return _.get(_.find(module.skills, x => x.id === skillId), 'flowGenerator')
  }

  public async getAllSkills(): Promise<Skill[]> {
    const skills = Array.from(this.entryPoints.values())
      .filter(module => module.skills)
      .map(module => {
        return module.skills!.map(skill => {
          return { id: skill.id, name: skill.name, moduleName: module.definition.name }
        })
      })

    return _.flatten(skills)
  }

  private getModule(module: string) {
    module = module.toLowerCase()
    if (!this.entryPoints.has(module)) {
      throw new Error(`Module '${module}' not registered`)
    }

    return this.entryPoints.get(module)!
  }
}

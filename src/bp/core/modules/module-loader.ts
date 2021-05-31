import {
  BotTemplate,
  Condition,
  ContentElement,
  ElementChangedAction,
  Flow,
  Logger,
  ModuleDefinition,
  ModuleEntryPoint,
  Skill
} from 'botpress/sdk'
import { ObjectCache } from 'common/object-cache'
import { ModuleInfo } from 'common/typings'
import { createForModule } from 'core/app/api'
import { BotService } from 'core/bots'
import { GhostService } from 'core/bpfs'
import { ConfigProvider } from 'core/config'
import { TYPES } from 'core/types'
import { ValidationError } from 'errors'
import { inject, injectable, tagged } from 'inversify'
import joi from 'joi'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import _ from 'lodash'
import path from 'path'
import tmp from 'tmp'

import { extractArchive } from '../misc/archive'
import { ConfigReader } from './config-reader'
import { ModuleResourceLoader } from './module-resources-loader'
import { clearModuleScriptCache } from './utils/require'
import { ModuleResolver } from './utils/resolver'

const MODULE_SCHEMA = joi.object().keys({
  onServerStarted: joi.func().optional(),
  onServerReady: joi.func().optional(),
  onBotMount: joi.func().optional(),
  onBotUnmount: joi.func().optional(),
  onModuleUnmount: joi.func().optional(),
  onTopicChanged: joi.func().optional(),
  onFlowChanged: joi.func().optional(),
  onFlowRenamed: joi.func().optional(),
  onElementChanged: joi.func().optional(),
  skills: joi.array().optional(),
  translations: joi.object().optional(),
  botTemplates: joi.array().optional(),
  dialogConditions: joi.array().optional(),
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
    homepage: joi.string().optional(),
    experimental: joi.boolean().optional(),
    workspaceApp: joi.object().optional()
  })
})

const extractModuleInfo = async ({ location, enabled }, resolver: ModuleResolver): Promise<ModuleInfo | undefined> => {
  try {
    const status = await resolver.getModuleInfo(location)
    if (!status || !status.valid) {
      return
    }

    const moduleInfo = {
      name: path.basename(location),
      fullPath: status.path,
      archived: status.archived,
      location,
      enabled
    }

    if (status.archived) {
      return moduleInfo
    }

    return {
      ...moduleInfo,
      ..._.pick(require(path.resolve(status.path, 'package.json')), [
        'name',
        'fullName',
        'description',
        'status',
        'version'
      ])
    }
    // silent catch
  } catch (err) {}
}

@injectable()
export class ModuleLoader {
  private entryPoints = new Map<string, ModuleEntryPoint>()
  private _configReader?: ConfigReader

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'ModuleLoader')
    private logger: Logger,
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.ObjectCache) private cache: ObjectCache
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

  // FIXME: Load modules for bots using onBotMount instead of init
  public async loadModules(modules: ModuleEntryPoint[]) {
    this.configReader = new ConfigReader(this.logger, modules, this.ghost, this.cache)
    await this.configReader.initialize()
    const initedModules = {}

    for (const module of modules) {
      const name = _.get(module, 'definition.name', '').toLowerCase()
      initedModules[name] = await this._loadModule(module, name)
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.callModulesOnReady(modules, initedModules) // Floating promise here is on purpose, we are doing this in background
    return Object.keys(initedModules)
  }

  public async disableModuleResources(modules: string[]) {
    for (const module of modules) {
      const resourceLoader = new ModuleResourceLoader(this.logger, module, this.ghost)
      await resourceLoader.disableResources()
    }
  }

  public async reloadModule(moduleLocation: string, moduleName: string) {
    const resolver = new ModuleResolver(this.logger)
    const absoluteLocation = await resolver.resolve(moduleLocation)
    await this.unloadModule(absoluteLocation, moduleName)

    // Adds the global config file if missing. Must be done before loading in case config is referenced in onServerStarted
    process.LOADED_MODULES[moduleName] = absoluteLocation

    await this.configReader.loadModuleGlobalConfigFile(moduleName)

    const entryPoint = resolver.requireModule(absoluteLocation)
    const isModuleLoaded = await this._loadModule(entryPoint, moduleName)

    // Module loaded successfully, we will process its regular lifecycle
    if (isModuleLoaded) {
      const api = await createForModule(moduleName)
      await entryPoint.onServerReady?.(api)

      if (entryPoint.onBotMount) {
        await Promise.mapSeries(BotService.getMountedBots(), x => entryPoint.onBotMount!(api, x))
      }
    }
  }

  private async _loadModule(module: ModuleEntryPoint, name: string) {
    try {
      ModuleLoader.processModuleEntryPoint(module, name)
      const api = await createForModule(name)
      await module.onServerStarted?.(api)

      this.entryPoints.set(name, module)

      const resourceLoader = new ModuleResourceLoader(this.logger, name, this.ghost)
      await resourceLoader.enableResources()
      await resourceLoader.runMigrations()
      await resourceLoader.importResources()
    } catch (err) {
      this.logger.attachError(err).error(`Error in module "${name}" onServerStarted`)
      return false
    }

    return true
  }

  public async unloadModule(moduleLocation: string, moduleName: string) {
    const loadedModule = this.entryPoints.get(moduleName)
    if (!loadedModule) {
      return
    }

    const api = await createForModule(moduleName)

    if (loadedModule.onBotUnmount) {
      await Promise.mapSeries(BotService.getMountedBots(), x => loadedModule.onBotUnmount!(api, x))
    }

    await loadedModule.onModuleUnmount?.(api)

    const resourceLoader = new ModuleResourceLoader(this.logger, moduleName, this.ghost)
    await resourceLoader.disableResources()

    this.entryPoints.delete(moduleName)
    clearModuleScriptCache(moduleLocation)
    delete process.LOADED_MODULES[moduleName]
  }

  public async unloadModulesForBot(botId: string) {
    const modules = this.getLoadedModules()
    for (const module of modules) {
      const entryPoint = this.getModule(module.name)
      const api = await createForModule(module.name)
      await entryPoint.onBotUnmount?.(api, botId)
    }
  }

  public async onTopicChanged(botId: string, oldName?: string, newName?: string) {
    const modules = this.getLoadedModules()
    for (const module of modules) {
      const entryPoint = this.getModule(module.name)
      const api = await createForModule(module.name)
      await entryPoint.onTopicChanged?.(api, botId, oldName, newName)
    }
  }

  public async onFlowChanged(botId: string, flow: Flow) {
    const modules = this.getLoadedModules()
    for (const module of modules) {
      const entryPoint = this.getModule(module.name)
      const api = await createForModule(module.name)
      await entryPoint.onFlowChanged?.(api, botId, flow)
    }
  }

  public async onFlowRenamed(botId: string, previousFlowName: string, newFlowName: string) {
    const modules = this.getLoadedModules()
    for (const module of modules) {
      const entryPoint = this.getModule(module.name)
      const api = await createForModule(module.name)
      await entryPoint.onFlowRenamed?.(api, botId, previousFlowName, newFlowName)
    }
  }

  public async onElementChanged(
    botId: string,
    action: ElementChangedAction,
    element: ContentElement,
    oldElement?: ContentElement
  ) {
    const modules = this.getLoadedModules()
    for (const module of modules) {
      const entryPoint = this.getModule(module.name)
      const api = await createForModule(module.name)
      await entryPoint.onElementChanged?.(api, botId, action, element, oldElement)
    }
  }

  private async callModulesOnReady(modules: ModuleEntryPoint[], initedModules: {}): Promise<void> {
    await AppLifecycle.waitFor(AppLifecycleEvents.HTTP_SERVER_READY)

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
        await module.onServerReady?.(api)
      } catch (err) {
        this.logger.warn(`Error in module "${name}" 'onServerReady'. Module will still be loaded. Err: ${err.message}`)
      }
    }

    AppLifecycle.setDone(AppLifecycleEvents.MODULES_READY)
  }

  public async loadModulesForBot(botId: string) {
    const modules = this.getLoadedModules()
    for (const module of modules) {
      try {
        const entryPoint = this.getModule(module.name)
        const api = await createForModule(module.name)
        await entryPoint.onBotMount?.(api, botId)
      } catch (err) {
        const details = err.response ? `for url ${err.response.config?.url}` : ''
        throw new Error(`while mounting bot in module ${module.name}: ${err} ${details}`)
      }
    }
  }

  public getBotTemplates(): BotTemplate[] {
    const modules = Array.from(this.entryPoints.values())
    const templates = modules
      .filter(module => module.botTemplates)
      .map(module => {
        return module.botTemplates!.map(template => {
          return { ...template, moduleId: module.definition.name, moduleName: module.definition.fullName }
        })
      })

    return _.flatten(templates)
  }

  public getDialogConditions(): Condition[] {
    const modules = Array.from(this.entryPoints.values())
    const conditions = _.flatMap(
      modules.filter(module => module.dialogConditions),
      x => x.dialogConditions
    ) as Condition[]

    return _.orderBy(conditions, x => x?.displayOrder)
  }

  public getLoadedModules(): ModuleDefinition[] {
    return Array.from(this.entryPoints.values()).map(x => x.definition)
  }

  public getFlowGenerator(moduleName: string, skillId: string): Function | undefined {
    const module = this.getModule(moduleName)
    const skill = _.find(module.skills, x => x.id === skillId)
    return skill?.flowGenerator
  }

  public async getAllSkills(): Promise<Partial<Skill>[]> {
    const skills = Array.from(this.entryPoints.values())
      .filter(module => module.skills)
      .map(module =>
        module.skills!.map(skill => ({
          id: skill.id,
          name: skill.name,
          icon: skill.icon,
          moduleName: module.definition.name
        }))
      )

    return _.flatten(skills)
  }

  public async getTranslations(): Promise<any> {
    const allTranslations = {}

    Array.from(this.entryPoints.values())
      .filter(module => module.translations)
      .forEach(mod => {
        Object.keys(mod.translations!).map(lang => {
          _.merge(allTranslations, {
            [lang]: {
              module: {
                [mod.definition.name]: mod.translations![lang]
              }
            }
          })
        })
      })

    return allTranslations
  }

  private getModule(module: string): ModuleEntryPoint {
    module = module.toLowerCase()
    if (!this.entryPoints.has(module)) {
      throw new Error(`Module '${module}' not registered`)
    }

    return this.entryPoints.get(module)!
  }

  public async getAllModules(): Promise<ModuleInfo[]> {
    const configModules = (await this.configProvider.getBotpressConfig()).modules

    // Add modules which are not listed in the config file
    const fileModules = await this.configProvider.getModulesListConfig()
    const missingModules = _.differenceBy(fileModules, configModules, 'location')

    const resolver = new ModuleResolver(this.logger)
    const allModules = await Promise.map([...configModules, ...missingModules], async mod =>
      extractModuleInfo(mod, resolver)
    )

    const filtered = _.uniqBy(allModules.filter(Boolean), 'location')
    return _.orderBy(filtered, 'name') as ModuleInfo[]
  }

  public async getArchiveModuleInfo(archive: Buffer): Promise<ModuleInfo | undefined> {
    const tmpDir = tmp.dirSync({ unsafeCleanup: true })
    const tmpFolder = tmpDir.name

    try {
      await extractArchive(archive, tmpFolder)

      const resolver = new ModuleResolver(this.logger)
      return await extractModuleInfo({ location: tmpFolder, enabled: false }, resolver)
    } catch (err) {
      this.logger.attachError(err).warn('Invalid module archive')
    } finally {
      tmpDir.removeCallback()
    }
  }
}

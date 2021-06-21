import { Logger, ModuleEntryPoint } from 'botpress/sdk'
import { ObjectCache } from 'common/object-cache'
import { GhostService } from 'core/bpfs'
import fs from 'fs'
import defaultJsonBuilder from 'json-schema-defaults'
import _ from 'lodash'
import { Memoize } from 'lodash-decorators'
import LRU from 'lru-cache'
import path from 'path'
import { VError } from 'verror'
import yn from 'yn'

import { getPropertiesRecursive, getValueFromEnvKey } from '../config/config-utils'

const debug = DEBUG('configuration').sub('modules')

export type ModuleConfig = Dic<any>

/**
 * Load configuration for a specific module in the following precedence order:
 * 1) Default Value (Least precedence)
 * 2) Global Value Override
 * 3) Environment Variable Override
 * 4) Per-bot Override (Most precedence)
 */
export class ConfigReader {
  private modules = new Map<string, ModuleEntryPoint>()
  private moduleConfigCache: LRU<string, any>

  constructor(
    private logger: Logger,
    modules: ModuleEntryPoint[],
    private ghost: GhostService,
    private cache: ObjectCache
  ) {
    for (const module of modules) {
      const name = _.get(module, 'definition.name', '').toLowerCase()
      if (name.length) {
        this.modules.set(name, module)
      }
    }
    this.moduleConfigCache = new LRU()
    this._listenForModuleConfigCacheInvalidation()
  }

  public async initialize() {
    await this.bootstrapGlobalConfigurationFiles()
  }

  @Memoize()
  private async getModuleConfigSchema(moduleId: string): Promise<any> {
    const modulePath = process.LOADED_MODULES[moduleId]
    if (!modulePath) {
      this.logger.warn(`Cannot load the config schema for module "${moduleId}". Module is disabled.`)
      return {}
    }

    try {
      const configSchema = path.resolve(modulePath, 'assets', 'config.schema.json')

      if (fs.existsSync(configSchema)) {
        return JSON.parse(fs.readFileSync(configSchema, 'utf-8'))
      }
    } catch (err) {
      this.logger.attachError(err).error(`Error while loading the config schema for module "${moduleId}"`)
    }

    return {}
  }

  public async loadFromDefaultValues(moduleId: string) {
    return defaultJsonBuilder(await this.getModuleConfigSchema(moduleId))
  }

  private async loadFromBotConfigFile(moduleId: string, botId: string): Promise<any> {
    const fileName = `${moduleId}.json`
    try {
      const json = await this.ghost.forBot(botId).readFileAsString('config', fileName)
      return JSON.parse(json)
    } catch (e) {
      return {}
    }
  }

  private async loadFromGlobalConfigFile(moduleId: string): Promise<any> {
    const fileName = `${moduleId}.json`
    try {
      const json = await this.ghost.global().readFileAsString('config', fileName)
      return JSON.parse(json)
    } catch (e) {
      throw new VError(e, `Could not load default config file for module "${moduleId}"`)
    }
  }

  private async loadFromEnvVariables(moduleId: string) {
    const schema = await this.getModuleConfigSchema(moduleId)
    const config = {}
    const debugConfig = debug.sub(moduleId)

    /* START DEPRECATED */
    // TODO: Remove support for those old env variables in BP 12 (we need to add those to 11 -> 12 migration guide)
    for (const option of Object.keys(schema?.properties || {})) {
      const keyOld = `BP_${moduleId}_${option}`.toUpperCase()
      if (keyOld in process.env) {
        const keyNew = `BP_MODULE_${moduleId}_${option}`.toUpperCase()
        this.logger.warn(
          `(Deprecated) use standard syntax to set module configuration by environment variable ${keyOld} ==> ${keyNew}`
        )
        config[option] = process.env[keyOld]
      }
    } /* END DEPRECATED */

    for (const option of getPropertiesRecursive(schema)) {
      const envOption = `${moduleId}_${option}`.replace(/[^A-Z0-9_]+/gi, '_')
      const envKey = `BP_MODULE_${envOption}`.toUpperCase()
      if (envKey in process.env) {
        // Using .set because it supports set on a path with dots
        const value = getValueFromEnvKey(envKey)
        _.set(config, option, value)
        debugConfig('ENV SET', { variable: option, env: envKey, value })
      } else {
        debugConfig('ENV NOT SET', { variable: option, env: envKey })
      }
    }

    return config
  }

  @Memoize()
  private async getModuleDefaultConfigFile(moduleId: string): Promise<any | undefined> {
    try {
      const defaultConfig = {
        $schema: `../../assets/modules/${moduleId}/config.schema.json`,
        ...defaultJsonBuilder(await this.getModuleConfigSchema(moduleId))
      }

      return JSON.stringify(defaultConfig, undefined, 2)
    } catch (err) {
      this.logger.attachError(err).error(`Couldn't generate the default json for module "${moduleId}"`)
    }
  }

  private async isGlobalConfigurationFileMissing(moduleId: string): Promise<boolean> {
    try {
      if ((await this.getModuleDefaultConfigFile(moduleId)) === undefined) {
        return false
      }

      await this.loadFromGlobalConfigFile(moduleId)
      return false
    } catch {
      return true
    }
  }

  /**
   * @private
   * For each module, check if the module's default `config.json` file has been copied
   * to the global configuration folder. If not, copy it and log to the console.
   */
  private async bootstrapGlobalConfigurationFiles() {
    for (const moduleId of this.modules.keys()) {
      await this.loadModuleGlobalConfigFile(moduleId)
    }
  }

  public async loadModuleGlobalConfigFile(moduleId: string) {
    if (await this.isGlobalConfigurationFileMissing(moduleId)) {
      const config = await this.getModuleDefaultConfigFile(moduleId)
      const fileName = `${moduleId}.json`
      await this.ghost.global().upsertFile('config', fileName, config)
      this.logger.debug(`Added missing "${fileName}" configuration file`)
    }
  }

  private async getMerged(moduleId: string, botId?: string, ignoreGlobal?: boolean): Promise<ModuleConfig> {
    let config = await this.loadFromDefaultValues(moduleId)

    if (!ignoreGlobal) {
      config = { ...config, ...(await this.loadFromGlobalConfigFile(moduleId)) }
    }

    config = { ...config, ...(await this.loadFromEnvVariables(moduleId)) }
    if (botId) {
      config = { ...config, ...(await this.loadFromBotConfigFile(moduleId, botId)) }
    }

    return config
  }

  private async getCachedOrFresh(key: string) {
    if (this.moduleConfigCache.has(key)) {
      return this.moduleConfigCache.get(key) || {}
    }

    const [moduleId, botId, ignoreGlobal] = key.split('//')
    const config = await this.getMerged(moduleId, botId, yn(ignoreGlobal))
    this.moduleConfigCache.set(key, config)

    return config
  }

  public async getGlobal(moduleId: string): Promise<ModuleConfig> {
    return this.getCachedOrFresh(moduleId)
  }

  public getForBot(moduleId: string, botId: string, ignoreGlobal?: boolean): Promise<ModuleConfig> {
    const cacheKey = `${moduleId}//${botId}//${!!ignoreGlobal}`
    return this.getCachedOrFresh(cacheKey)
  }

  private _listenForModuleConfigCacheInvalidation() {
    this.cache.events.on('invalidation', key => {
      try {
        const moduleId = key.match(/^.*::data\/.*\/config\/([\s\S]+([a-zA-Z0-9-_])+\.json)/i)?.[1]?.replace('.json', '')

        if (moduleId) {
          this.moduleConfigCache
            .keys()
            .filter(x => x.startsWith(moduleId))
            .forEach(x => this.moduleConfigCache.del(x))
        }
      } catch (err) {
        this.logger.error('Error invalidating module config cache: ' + err.message)
      }
    })
  }
}

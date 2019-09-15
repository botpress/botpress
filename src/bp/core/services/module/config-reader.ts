import { Logger, ModuleEntryPoint } from 'botpress/sdk'
import fs from 'fs'
import defaultJsonBuilder from 'json-schema-defaults'
import _ from 'lodash'
import { Memoize } from 'lodash-decorators'
import path from 'path'
import { VError } from 'verror'

import { GhostService } from '../'

const debug = DEBUG('configuration').sub('modules')

type Config = { [key: string]: any }

/**
 * Load configuration for a specific module in the following precedence order:
 * 1) Default Value (Least precedence)
 * 2) Global Value Override
 * 3) Environement Variable Override
 * 4) Per-bot Override (Most precedence)
 */
export default class ConfigReader {
  private modules = new Map<string, ModuleEntryPoint>()

  constructor(private logger: Logger, modules: ModuleEntryPoint[], private ghost: GhostService) {
    for (const module of modules) {
      const name = _.get(module, 'definition.name', '').toLowerCase()
      if (name.length) {
        this.modules.set(name, module)
      }
    }
  }

  public async initialize() {
    await this.bootstrapGlobalConfigurationFiles()
  }

  @Memoize()
  private async getModuleConfigSchema(moduleId: string): Promise<any> {
    const modulePath = process.LOADED_MODULES[moduleId]
    const configSchema = path.resolve(modulePath, 'assets', 'config.schema.json')

    try {
      if (fs.existsSync(configSchema)) {
        return JSON.parse(fs.readFileSync(configSchema, 'utf-8'))
      }
    } catch (err) {
      this.logger.attachError(err).error(`Error while loading the config schema for module "${moduleId}"`)
    }
    return {}
  }

  private async loadFromDefaultValues(moduleId) {
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
    for (const option of Object.keys(schema.properties)) {
      const keyOld = `BP_${moduleId}_${option}`.toUpperCase()
      if (keyOld in process.env) {
        debugConfig('(deprecated) setting env variable', { variable: option, env: keyOld, module: moduleId })
        config[option] = process.env[keyOld]
      }
    } /* END DEPRECATED */

    const getPropertiesRecursive = (obj: any, path: string = ''): string[] => {
      if (obj && obj.type === 'object' && obj.properties) {
        return _.chain(Object.keys(obj.properties))
          .filter(x => !x.startsWith('$'))
          .map(key => getPropertiesRecursive(obj.properties[key], path.length ? path + '.' + key : key))
          .flatten()
          .value()
      }

      return [path]
    }

    const getValue = (key: string) => {
      try {
        return JSON.parse(process.env[key]!)
      } catch (err) {
        return process.env[key]
      }
    }

    for (const option of getPropertiesRecursive(schema)) {
      const envOption = `${moduleId}_${option}`.replace(/[^A-Z0-9_]+/gi, '_')
      const envKey = `BP_MODULE_${envOption}`.toUpperCase()
      if (envKey in process.env) {
        // Using .set because it supports set on a path with dots
        const value = getValue(envKey)
        _.set(config, option, value)
        debugConfig('ENV SET', { variable: option, env: envKey, value })
      } else {
        debugConfig('ENV NOT SET', { variable: option, env: envKey })
      }
    }

    return config
  }

  @Memoize()
  private async getModuleDefaultConfigFile(moduleId): Promise<any | undefined> {
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
      if (await this.isGlobalConfigurationFileMissing(moduleId)) {
        const config = await this.getModuleDefaultConfigFile(moduleId)
        const fileName = `${moduleId}.json`
        await this.ghost.global().upsertFile('config', fileName, config)
        this.logger.debug(`Added missing "${fileName}" configuration file`)
      }
    }
  }

  private async getMerged(moduleId: string, botId?: string): Promise<Config> {
    let config = await this.loadFromDefaultValues(moduleId)
    config = { ...config, ...(await this.loadFromGlobalConfigFile(moduleId)) }
    config = { ...config, ...(await this.loadFromEnvVariables(moduleId)) }
    if (botId) {
      config = { ...config, ...(await this.loadFromBotConfigFile(moduleId, botId)) }
    }

    return config
  }

  @Memoize()
  public async getGlobal(moduleId: string): Promise<Config> {
    return this.getMerged(moduleId)
  }

  // Don't @Memoize() this fn. It only memoizes on the first argument
  // https://github.com/steelsojka/lodash-decorators/blob/master/src/memoize.ts#L15
  public getForBot(moduleId: string, botId: string): Promise<Config> {
    return this.getMerged(moduleId, botId)
  }
}

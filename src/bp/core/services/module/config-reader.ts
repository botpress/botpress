import { Logger, ModuleConfigEntry, ModuleEntryPoint } from 'botpress/sdk'
import json5 from 'json5'
import _ from 'lodash'
import { Memoize } from 'lodash-decorators'
import { VError } from 'verror'
import yn from 'yn'

import { GhostService } from '../'

type Config = { [key: string]: any }

const validations = {
  any: (value, validation) => validation(value),
  string: (value, validation) => typeof value === 'string' && validation(value),
  choice: (value, validation) => _.includes(validation, value),
  bool: (value, validation) => (yn(value) === true || yn(value) === false) && validation(value)
}

const transformers = {
  bool: value => yn(value)
}

const defaultValues = {
  any: undefined,
  string: '',
  bool: false
}

const amendOption = (option, name) => {
  const validTypes = _.keys(validations)
  if (!option.type || !_.includes(validTypes, option.type)) {
    throw new Error(`Invalid type (${option.type || ''}) for config key (${name})`)
  }

  const validation = option.validation || (() => true)

  if (option.default !== undefined && !validations[option.type](option.default, validation)) {
    throw new Error(`Invalid default value (${option.default}) for (${name})`)
  }

  if (!option.default && !_.includes(_.keys(defaultValues), option.type)) {
    throw new Error(`Default value is mandatory for type ${option.type} (${name})`)
  }

  return {
    type: option.type,
    required: option.required || false,
    env: option.env || undefined,
    default: option.default || defaultValues[option.type],
    validation: validation
  }
}

const amendOptions = options => {
  return _.mapValues(options, amendOption)
}

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
  private getModuleOptions(moduleId: string): { [key: string]: ModuleConfigEntry } {
    if (!this.modules.has(moduleId)) {
      throw new Error(
        `Could not load configuration options for module "${moduleId}". Module was not found or registered properly.`
      )
    }

    return amendOptions(this.modules.get(moduleId)!.config)
  }

  private async loadFromDefaultValues(moduleId) {
    return _.mapValues(await this.getModuleOptions(moduleId), value => value.default)
  }

  private async loadFromBotConfigFile(moduleId: string, botId: string): Promise<any> {
    const fileName = `${moduleId}.json`
    try {
      const json = await this.ghost.forBot(botId).readFileAsString('config', fileName)
      return json5.parse(json)
    } catch (e) {
      return {}
    }
  }

  private async loadFromGlobalConfigFile(moduleId: string): Promise<any> {
    const fileName = `${moduleId}.json`
    try {
      const json = await this.ghost.global().readFileAsString('config', fileName)
      return json5.parse(json)
    } catch (e) {
      throw new VError(e, `Could not load default config file for module "${moduleId}"`)
    }
  }

  private loadFromEnvVariables(moduleId: string) {
    const options = this.getModuleOptions(moduleId)
    const config = {}

    _.mapValues(process.env, (value, key) => {
      if (_.isNil(value)) {
        return
      }
      const entry = _.findKey(options, { env: key })
      if (entry) {
        config[entry] = value
      }
    })

    return config
  }

  @Memoize()
  private getModuleDefaultConfigFile(moduleId): any | undefined {
    return this.modules.get(moduleId)!.defaultConfigJson
  }

  private async isGlobalConfigurationFileMissing(moduleId: string): Promise<boolean> {
    try {
      if (this.getModuleDefaultConfigFile(moduleId) === undefined) {
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
        const config = this.getModuleDefaultConfigFile(moduleId)
        const fileName = `${moduleId}.json`
        await this.ghost.global().upsertFile('config', fileName, config)
        this.logger.debug(`Added missing "${fileName}" configuration file`)
      }
    }
  }

  private async getMerged(moduleId: string, botId?: string): Promise<Config> {
    const options = this.getModuleOptions(moduleId)
    let config = await this.loadFromDefaultValues(moduleId)
    config = { ...config, ...(await this.loadFromGlobalConfigFile(moduleId)) }
    config = { ...config, ...(await this.loadFromEnvVariables(moduleId)) }
    if (botId) {
      config = { ...config, ...(await this.loadFromBotConfigFile(moduleId, botId)) }
    }

    return _.mapValues(config, (value, key) => {
      if (options[key] !== undefined) {
        const { type } = options[key]
        if (transformers[type]) {
          return transformers[type](value)
        } else {
          return value
        }
      } else {
        this.logger.warn(`Invalid configuration "${key}" found in module ${moduleId}`)
      }
    })
  }

  @Memoize()
  public async getGlobal(moduleId: string): Promise<Config> {
    return this.getMerged(moduleId)
  }

  @Memoize()
  public getForBot(moduleId: string, botId: string): Promise<Config> {
    return this.getMerged(moduleId, botId)
  }
}

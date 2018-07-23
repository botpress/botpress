import path from 'path'
import fs from 'fs'
import _ from 'lodash'

export default class ModuleConfiguration {
  constructor(options) {
    this.manager = options.manager
    this.module = options.module
    this.logger = options.logger
    this.configLocation = options.configLocation
  }

  _getFileName() {
    const sanitizedName = this.module.name
      .replace(/^@botpress(-)?\//i, '')
      .replace(/^botpress(-)?/i, '')
      .replace(path.delimiter, '_')

    return `${sanitizedName}.json`
  }

  _getOptions() {
    return this.module.options
  }

  _hasDefaultConfig() {
    const filePath = path.resolve(this.module.path, 'config.json')
    return fs.existsSync(filePath)
  }

  _readDefaultConfig() {
    const filePath = path.resolve(this.module.path, 'config.json')
    return fs.readFileSync(filePath, 'utf8')
  }

  async loadAll(caching = true) {
    const config = await this.manager.loadAll(this._getFileName(), this._getOptions(), caching)

    const file = this._getFileName()
    const filePath = path.resolve(this.configLocation, file)

    _.mapValues(config, (value, key) => {
      if (value === '<<UPDATE_ME>>') {
        const message = `[${this.module.name}] Missing mandatory configuration for "${key}". 
You can provide this value in "${filePath}"`
        this.logger.error(message)
        throw new Error(message)
      }
    })

    return config
  }

  saveAll(newConfig) {
    const configPath = path.join(this.configLocation, this._getFileName())
    const oldConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'))

    const config = Object.assign(oldConfig, newConfig)
    fs.writeFileSync(configPath, JSON.stringify(config), 'utf8')
  }

  async get(key, caching = true) {
    return this.manager.get(this._getFileName(), key, this._getOptions(), caching)
  }

  /**
   * Copy the module's default configuration file to the bot's config directory
   * @private
   */
  async bootstrap() {
    if (!this._hasDefaultConfig()) {
      return
    }

    const file = this._getFileName()
    const filePath = path.resolve(this.configLocation, file)
    const content = this._readDefaultConfig()

    fs.writeFileSync(filePath, content, 'utf8')
    this.logger.info(`Configuration for module "${this.module.name}" has been created at ${filePath}`)
  }

  /**
   * Checks whether the module has a configuration file
   * and if the bot doesn't have the configuration file for it.
   * @private
   * @return {Boolean}
   */
  async isConfigMissing() {
    const file = this._getFileName()
    const filePath = path.resolve(this.configLocation, file)
    return this._hasDefaultConfig() && !fs.existsSync(filePath)
  }
}

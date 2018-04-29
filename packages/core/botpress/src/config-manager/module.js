import path from 'path'
import fs from 'fs'

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
    return this.manager.loadAll(this._getFileName(), this._getOptions(), caching)
  }

  async get(key, caching = true) {
    return this.manager.get(this._getFileName(), key, this._getOptions(), caching)
  }

  /**
   * Copy the module's default configuration file to the bot's config directory
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
   * @return {Boolean}
   */
  async isConfigMissing() {
    const file = this._getFileName()
    const filePath = path.resolve(this.configLocation, file)

    console.log(this._hasDefaultConfig(), filePath)
    return this._hasDefaultConfig() && !fs.existsSync(filePath)
  }
}

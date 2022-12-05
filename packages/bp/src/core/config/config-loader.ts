import { BotConfig, Logger } from 'botpress/sdk'
import { ObjectCache } from 'common/object-cache'
import { GhostService } from 'core/bpfs'
import { calculateHash, stringify } from 'core/misc/utils'
import { ModuleResolver } from 'core/modules'
import { TYPES } from 'core/types'
import { FatalError } from 'errors'
import fs from 'fs'
import { inject, injectable } from 'inversify'
import defaultJsonBuilder from 'json-schema-defaults'
import _, { PartialDeep } from 'lodash'
import path from 'path'

import { BotpressConfig } from './botpress.config'
import { getValidJsonSchemaProperties, getValueFromEnvKey, SchemaNode } from './config-utils'

/**
 * These properties should not be considered when calculating the config hash
 * They are always read from the configuration file and can be dynamically changed
 */
const removeDynamicProps = config => _.omit(config, ['superAdmins'])

@injectable()
export class ConfigProvider {
  public onBotpressConfigChanged: ((initialHash: string, newHash: string) => Promise<void>) | undefined

  private _botpressConfigCache: BotpressConfig | undefined
  public initialConfigHash: string | undefined
  public currentConfigHash!: string
  private _deprecateEnvVarWarned = false

  constructor(
    @inject(TYPES.GhostService) private ghostService: GhostService,
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.ObjectCache) private cache: ObjectCache
  ) {
    this.cache.events.on('invalidation', async key => {
      if (key === 'object::data/global/botpress.config.json' || key === 'file::data/global/botpress.config.json') {
        this._botpressConfigCache = undefined
        const config = await this.getBotpressConfig()

        this.currentConfigHash = calculateHash(JSON.stringify(removeDynamicProps(config)))
        this.onBotpressConfigChanged && this.onBotpressConfigChanged(this.initialConfigHash!, this.currentConfigHash)
      }
    })
  }

  async getBotpressConfig(): Promise<BotpressConfig> {
    if (this._botpressConfigCache) {
      return this._botpressConfigCache
    }

    await this.createDefaultConfigIfMissing()

    const config = await this.getConfig<BotpressConfig>('botpress.config.json')
    _.merge(config, await this._loadBotpressConfigFromEnv(config))

    // deprecated notice
    const envPort = process.env.BP_PORT || process.env.PORT
    config.httpServer.port = envPort ? parseInt(envPort) : config.httpServer.port
    config.httpServer.host = process.env.BP_HOST || config.httpServer.host
    process.PROXY = process.core_env.BP_PROXY || config.httpServer.proxy

    if (config.pro) {
      config.pro.licenseKey = process.env.BP_LICENSE_KEY || config.pro.licenseKey
    }

    this._warnDeprecatedKeys()

    this._botpressConfigCache = config

    if (!this.initialConfigHash) {
      this.initialConfigHash = calculateHash(JSON.stringify(removeDynamicProps(config)))
    }

    return config
  }

  private _warnDeprecatedKeys() {
    if (this._deprecateEnvVarWarned) {
      return
    }

    const deprecatedEnvKeys = [
      ['BP_PORT', 'httpServer.port'],
      ['BP_HOST', 'httpServer.host'],
      ['BP_PROXY', 'httpServer.proxy'],
      ['BP_LICENSE_KEY', 'pro.licenseKey'],
      ['PRO_ENABLED', 'pro.enabled']
    ]
    deprecatedEnvKeys.forEach(([depr, preferred]) => {
      const newKey = this._makeBPConfigEnvKey(preferred)
      if (process.env[depr] !== undefined) {
        this.logger.warn(
          `(Deprecated) use standard syntax to set config from environment variable: ${depr} ==> ${newKey}`
        )
      }
    })

    this._deprecateEnvVarWarned = true
  }

  private _makeBPConfigEnvKey(option: string): string {
    return `BP_CONFIG_${option.split('.').join('_')}`.toUpperCase()
  }

  private async _loadBotpressConfigFromEnv(currentConfig: BotpressConfig): Promise<PartialDeep<BotpressConfig>> {
    const configOverrides: PartialDeep<BotpressConfig> = {}
    const weakSchema = await this._getBotpressConfigSchema()
    const options = await getValidJsonSchemaProperties(weakSchema as SchemaNode, currentConfig)
    for (const option of options) {
      const envKey = this._makeBPConfigEnvKey(option)
      const value = getValueFromEnvKey(envKey)
      if (value !== undefined) {
        _.set(configOverrides, option, value)
      }
    }

    return configOverrides
  }

  async mergeBotpressConfig(partialConfig: PartialDeep<BotpressConfig>, clearHash?: boolean): Promise<void> {
    this._botpressConfigCache = undefined
    const content = await this.ghostService.global().readFileAsString('/', 'botpress.config.json')
    const config = _.merge(JSON.parse(content), partialConfig)

    await this.setBotpressConfig(config, clearHash)
  }

  async setBotpressConfig(config: BotpressConfig, clearHash?: boolean): Promise<void> {
    await this.ghostService.global().upsertFile('/', 'botpress.config.json', stringify(config))

    if (clearHash) {
      this.initialConfigHash = undefined
    }
  }

  async getBotConfig(botId: string): Promise<BotConfig> {
    return this.getConfig<BotConfig>('bot.config.json', botId)
  }

  async setBotConfig(botId: string, config: BotConfig, ignoreLock?: boolean) {
    await this.ghostService.forBot(botId).upsertFile('/', 'bot.config.json', stringify(config), { ignoreLock })
  }

  async mergeBotConfig(botId: string, partialConfig: PartialDeep<BotConfig>, ignoreLock?: boolean): Promise<BotConfig> {
    const originalConfig = await this.getBotConfig(botId)
    const config = _.merge(originalConfig, partialConfig)
    await this.setBotConfig(botId, config, ignoreLock)
    return config
  }

  private async _getBotpressConfigSchema(): Promise<object> {
    return this.ghostService.root().readFileAsObject<any>('/', 'botpress.config.schema.json')
  }

  public async createDefaultConfigIfMissing() {
    await this._copyConfigSchemas()

    if (!(await this.ghostService.global().fileExists('/', 'botpress.config.json'))) {
      const botpressConfigSchema = await this._getBotpressConfigSchema()
      const defaultConfig: BotpressConfig = defaultJsonBuilder(botpressConfigSchema)

      const config = {
        $schema: '../botpress.config.schema.json',
        ...defaultConfig,
        modules: await this.getModulesListConfig(),
        version: process.BOTPRESS_VERSION
      }

      await this.ghostService.global().upsertFile('/', 'botpress.config.json', stringify(config))
    }
  }

  private async _copyConfigSchemas() {
    const schemasToCopy = ['botpress.config.schema.json', 'bot.config.schema.json']

    for (const schema of schemasToCopy) {
      if (!(await this.ghostService.root().fileExists('/', schema))) {
        const schemaContent = fs.readFileSync(path.join(__dirname, 'schemas', schema))
        await this.ghostService.root().upsertFile('/', schema, schemaContent)
      }
    }
  }

  public async getModulesListConfig() {
    const enabledModules = this.parseEnabledModules() ?? [
      'analytics',
      'basic-skills',
      'builtin',
      'channel-web',
      'nlu',
      'code-editor',
      'testing',
      'examples',
      'misunderstood',
      'hitlnext'
    ]

    // here it's ok to use the module resolver because we are discovering the built-in modules only
    const resolver = new ModuleResolver(this.logger)
    return (await resolver.getModulesList()).map(module => {
      return { location: `MODULES_ROOT/${module}`, enabled: enabledModules.includes(module) }
    })
  }

  private parseEnabledModules = (): string[] | undefined => {
    if (!process.env.BP_ENABLED_MODULES) {
      return
    }

    try {
      return JSON.parse(process.env.BP_ENABLED_MODULES)
    } catch (err) {
      this.logger
        .attachError(err)
        .warn('Error parsing BP_ENABLED_MODULES environment variable. Falling back to default modules')
    }
  }

  private async getConfig<T>(fileName: string, botId?: string): Promise<T> {
    try {
      let content: string

      if (botId) {
        content = await this.ghostService
          .forBot(botId)
          .readFileAsString('/', fileName)
          .catch(_err => this.ghostService.forBot(botId).readFileAsString('/', fileName))
      } else {
        content = await this.ghostService
          .global()
          .readFileAsString('/', fileName)
          .catch(_err => this.ghostService.global().readFileAsString('/', fileName))
      }

      if (!content) {
        throw new FatalError(`Modules configuration file "${fileName}" not found`)
      }

      // Variables substitution
      // TODO Check of a better way to handle path correction
      content = content.replace('%BOTPRESS_DIR%', process.PROJECT_LOCATION.replace(/\\/g, '/'))
      content = content.replace('"$isProduction"', process.IS_PRODUCTION ? 'true' : 'false')
      content = content.replace('"$isDevelopment"', process.IS_PRODUCTION ? 'false' : 'true')

      const vars = content.match(/%([a-zA-Z0-9_]+)%/gim)
      vars?.forEach(varName => {
        content = content.replace(varName, getValueFromEnvKey(varName.replace(/%/g, '')))
      })

      return <T>JSON.parse(content)
    } catch (e) {
      throw new FatalError(e, `Error reading configuration file "${fileName}"`)
    }
  }

  public async getBrandingConfig(appName: 'admin' | 'studio' | 'webchat') {
    const defaultConfig = {
      admin: {
        title: 'Botpress Admin Panel',
        favicon: 'assets/admin/ui/public/favicon.ico',
        customCss: ''
      },
      studio: {
        title: 'Botpress Studio',
        favicon: 'assets/studio/ui/public/img/favicon.png',
        customCss: ''
      },
      webchat: {
        title: 'Botpress Webchat',
        favicon: 'assets/studio/ui/public/img/favicon.png',
        customCss: ''
      }
    }

    if (!process.IS_PRO_ENABLED) {
      return defaultConfig[appName]
    }

    const config = await this.getBotpressConfig()
    const { title, favicon, customCss } = config.pro?.branding?.[appName] ?? defaultConfig[appName] ?? {}

    return {
      title: title || '',
      favicon: favicon || '',
      customCss: customCss || ''
    }
  }
}

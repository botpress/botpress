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

  constructor(
    @inject(TYPES.GhostService) private ghostService: GhostService,
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.ObjectCache) private cache: ObjectCache
  ) {
    this.cache.events.on('invalidation', async key => {
      if (key === 'object::data/global/botpress.config.json') {
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

    const config = await this.getConfig<BotpressConfig>('botpress.config.json')
    _.merge(config, await this._loadBotpressConfigFromEnv(config))

    // deprecated notice
    const envPort = process.env.BP_PORT || process.env.PORT
    config.httpServer.port = envPort ? parseInt(envPort) : config.httpServer.port
    config.httpServer.host = process.env.BP_HOST || config.httpServer.host
    process.PROXY = process.core_env.BP_PROXY || config.httpServer.proxy

    this._botpressConfigCache = config

    return config
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

      return <T>JSON.parse(content)
    } catch (e) {
      throw new FatalError(e, `Error reading configuration file "${fileName}"`)
    }
  }

  public async getBrandingConfig(appName: 'admin' | 'studio') {
    const defaultConfig = {
      admin: {
        title: 'Botpress Admin Panel',
        favicon: 'assets/admin/ui/public/favicon.ico',
        customCss: ''
      },
      studio: {
        title: 'Botpress Studio',
        favicon: 'assets/ui-studio/public/img/favicon.png',
        customCss: ''
      }
    }

    if (!process.IS_PRO_ENABLED) {
      return defaultConfig[appName]
    }

    const config = await this.getBotpressConfig()
    const { title, favicon, customCss } = config.pro?.branding?.[appName] ?? {}

    return {
      title: title || '',
      favicon: favicon || '',
      customCss: customCss || ''
    }
  }
}

import { BotConfig, Logger } from 'botpress/sdk'
import ModuleResolver from 'core/modules/resolver'
import { GhostService } from 'core/services'
import { TYPES } from 'core/types'
import { FatalError } from 'errors'
import fs from 'fs'
import fse from 'fs-extra'
import { inject, injectable } from 'inversify'
import defaultJsonBuilder from 'json-schema-defaults'
import _, { PartialDeep } from 'lodash'
import path from 'path'

import { BotpressConfig } from './botpress.config'

@injectable()
export class ConfigProvider {
  private _botpressConfigCache: BotpressConfig | undefined

  constructor(
    @inject(TYPES.GhostService) private ghostService: GhostService,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  async getBotpressConfig(): Promise<BotpressConfig> {
    if (this._botpressConfigCache) {
      return this._botpressConfigCache
    }

    await this.createDefaultConfigIfMissing()

    const config = await this.getConfig<BotpressConfig>('botpress.config.json')

    config.httpServer.port = process.env.PORT ? parseInt(process.env.PORT) : config.httpServer.port
    config.httpServer.host = process.env.BP_HOST || config.httpServer.host
    process.PROXY = process.core_env.BP_PROXY || config.httpServer.proxy

    if (config.pro) {
      config.pro.licenseKey = process.env.BP_LICENSE_KEY || config.pro.licenseKey
    }

    this._botpressConfigCache = config
    return config
  }

  async mergeBotpressConfig(partialConfig: PartialDeep<BotpressConfig>): Promise<void> {
    this._botpressConfigCache = undefined
    const content = await this.ghostService.global().readFileAsString('/', 'botpress.config.json')
    const config = _.merge(JSON.parse(content), partialConfig)
    await this.ghostService.global().upsertFile('/', 'botpress.config.json', JSON.stringify(config, undefined, 2))
  }

  async invalidateBotpressConfig(): Promise<void> {
    this._botpressConfigCache = undefined
    await this.ghostService.global().invalidateFile('/', 'botpress.config.json')
  }

  async getBotConfig(botId: string): Promise<BotConfig> {
    return this.getConfig<BotConfig>('bot.config.json', botId)
  }

  async setBotConfig(botId: string, config: BotConfig) {
    await this.ghostService.forBot(botId).upsertFile('/', 'bot.config.json', JSON.stringify(config, undefined, 2))
  }

  async mergeBotConfig(botId: string, partialConfig: PartialDeep<BotConfig>): Promise<BotConfig> {
    const originalConfig = await this.getBotConfig(botId)
    const config = _.merge(originalConfig, partialConfig)
    await this.setBotConfig(botId, config)
    return config
  }

  public async createDefaultConfigIfMissing() {
    const botpressConfig = path.resolve(process.PROJECT_LOCATION, 'data', 'global', 'botpress.config.json')

    if (!fse.existsSync(botpressConfig)) {
      await this.ensureDataFolderStructure()

      const botpressConfigSchema = path.resolve(process.PROJECT_LOCATION, 'data', 'botpress.config.schema.json')
      const defaultConfig = defaultJsonBuilder(JSON.parse(fse.readFileSync(botpressConfigSchema, 'utf-8')))

      const config = {
        $schema: `../botpress.config.schema.json`,
        ...defaultConfig,
        modules: await this.getModulesListConfig(),
        version: process.BOTPRESS_VERSION
      }

      await fse.writeFileSync(botpressConfig, JSON.stringify(config, undefined, 2))
    }
  }

  private async ensureDataFolderStructure() {
    const requiredFolders = ['bots', 'global', 'storage']
    const schemasToCopy = ['botpress.config.schema.json', 'bot.config.schema.json']
    const dataFolder = path.resolve(process.PROJECT_LOCATION, 'data')

    for (const folder of requiredFolders) {
      await fse.ensureDir(path.resolve(dataFolder, folder))
    }

    for (const schema of schemasToCopy) {
      const schemaContent = fs.readFileSync(path.join(__dirname, 'schemas', schema))
      fs.writeFileSync(path.resolve(dataFolder, schema), schemaContent)
    }
  }

  public async getModulesListConfig() {
    const enabledByDefault = [
      'analytics',
      'basic-skills',
      'builtin',
      'channel-web',
      'nlu',
      'qna',
      'extensions',
      'code-editor',
      'testing'
    ]

    // here it's ok to use the module resolver because we are discovering the built-in modules only
    const resolver = new ModuleResolver(this.logger)
    return await resolver.getModulesList().map(module => {
      return { location: `MODULES_ROOT/${module}`, enabled: enabledByDefault.includes(module) }
    })
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
}

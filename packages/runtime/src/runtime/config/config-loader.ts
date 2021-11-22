import { BotConfig, Logger } from 'botpress/runtime-sdk'
import { ObjectCache } from 'common/object-cache'
import { FatalError } from 'errors'
import fs from 'fs'
import { Runtime } from 'inspector'
import { inject, injectable } from 'inversify'
import defaultJsonBuilder from 'json-schema-defaults'
import _, { PartialDeep } from 'lodash'
import path from 'path'
import { GhostService } from 'runtime/bpfs'

import { RuntimeConfig } from 'runtime/config'
import { calculateHash, stringify } from 'runtime/misc/utils'
import { TYPES } from 'runtime/types'
import { getValidJsonSchemaProperties, getValueFromEnvKey, SchemaNode } from './config-utils'
/**
 * These properties should not be considered when calculating the config hash
 * They are always read from the configuration file and can be dynamically changed
 */
const removeDynamicProps = config => _.omit(config, ['superAdmins'])

@injectable()
export class ConfigProvider {
  public onBotpressConfigChanged: ((initialHash: string, newHash: string) => Promise<void>) | undefined

  private _botpressConfigCache: RuntimeConfig | undefined
  public initialConfigHash: string | undefined
  public currentConfigHash!: string
  private _deprecateEnvVarWarned = false

  constructor(
    @inject(TYPES.GhostService) private ghostService: GhostService,
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.ObjectCache) private cache: ObjectCache
  ) {}

  setRuntimeConfig(config: RuntimeConfig) {
    this._botpressConfigCache = config
  }

  async getRuntimeConfig(): Promise<RuntimeConfig> {
    if (this._botpressConfigCache) {
      return this._botpressConfigCache
    }

    await this.createDefaultConfigIfMissing()

    const config = await this.getConfig<RuntimeConfig>('runtime.config.json')
    this._botpressConfigCache = config

    return config
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
    return this.ghostService.root().readFileAsObject<any>('/', 'runtime.config.schema.json')
  }

  public async createDefaultConfigIfMissing() {
    await this._copyConfigSchemas()

    if (!(await this.ghostService.global().fileExists('/', 'runtime.config.json'))) {
      const botpressConfigSchema = await this._getBotpressConfigSchema()
      const defaultConfig: RuntimeConfig = defaultJsonBuilder(botpressConfigSchema)

      const config = {
        $schema: '../runtime.config.schema.json',
        ...defaultConfig,
        version: process.BOTPRESS_VERSION
      }

      await this.ghostService.global().upsertFile('/', 'runtime.config.json', stringify(config))
    }
  }

  private async _copyConfigSchemas() {
    const schemasToCopy = ['runtime.config.schema.json']

    for (const schema of schemasToCopy) {
      if (!(await this.ghostService.root().fileExists('/', schema))) {
        const schemaContent = fs.readFileSync(path.join(__dirname, 'schemas', schema))
        await this.ghostService.root().upsertFile('/', schema, schemaContent)
      }
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

      return <T>JSON.parse(content)
    } catch (e) {
      throw new FatalError(e, `Error reading configuration file "${fileName}"`)
    }
  }
}

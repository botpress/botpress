import { GhostService } from 'core/services'
import { TYPES } from 'core/types'
import { FatalError } from 'errors'
import { inject, injectable } from 'inversify'
import _ from 'lodash'
import yn from 'yn'

import { BotConfig } from './bot.config'
import { BotpressConfig, DatabaseType } from './botpress.config'

export interface ConfigProvider {
  getBotpressConfig(): Promise<BotpressConfig>
  mergeBotpressConfig(partialConfig: Partial<BotpressConfig>): Promise<void>
  getBotConfig(botId: string): Promise<BotConfig>
  setBotConfig(botId: string, config: BotConfig): Promise<void>
}

@injectable()
export class GhostConfigProvider implements ConfigProvider {
  constructor(
    @inject(TYPES.GhostService) private ghostService: GhostService,
    @inject(TYPES.IsProduction) private isProduction: string
  ) {}

  async getBotpressConfig(): Promise<BotpressConfig> {
    const config = await this.getConfig<BotpressConfig>('botpress.config.json')

    const host = process.env.BP_HOST || config.httpServer.host
    config.httpServer.host = host === 'localhost' ? undefined : host
    config.httpServer.proxyPort = process.env.PORT ? parseInt(process.env.PORT) : config.httpServer.proxyPort
    config.database.type = process.env.DATABASE ? <DatabaseType>process.env.DATABASE : config.database.type
    config.database.url = process.env.DATABASE_URL ? process.env.DATABASE_URL : config.database.url

    config.ghost.enabled = yn(process.env.GHOST_ENABLED) || config.ghost.enabled
    config.licenseKey = process.env.BP_LICENSE_KEY || config.licenseKey

    return config
  }

  async mergeBotpressConfig(partialConfig: Partial<BotpressConfig>): Promise<void> {
    const content = await this.ghostService.global().readFileAsString('/', 'botpress.config.json')
    const config = _.merge(JSON.parse(content), partialConfig)
    await this.ghostService.global().upsertFile('/', 'botpress.config.json', JSON.stringify(config, undefined, 2))
  }

  async getBotConfig(botId: string): Promise<BotConfig> {
    return this.getConfig<BotConfig>('bot.config.json', botId)
  }

  async setBotConfig(botId: string, config: BotConfig) {
    await this.ghostService.forBot(botId).upsertFile('/', 'bot.config.json', JSON.stringify(config, undefined, 2))
  }

  private async getConfig<T>(fileName: string, botId?: string): Promise<T> {
    try {
      let content: string

      if (botId) {
        content = await this.ghostService.forBot(botId).readFileAsString('/', fileName)
      } else {
        content = await this.ghostService.global().readFileAsString('/', fileName)
      }

      if (!content) {
        throw new FatalError(`Modules configuration file "${fileName}" not found`)
      }

      // Variables substitution
      // TODO Check of a better way to handle path correction
      content = content.replace('%BOTPRESS_DIR%', process.PROJECT_LOCATION.replace(/\\/g, '/'))
      content = content.replace('"$isProduction"', this.isProduction ? 'true' : 'false')
      content = content.replace('"$isDevelopment"', this.isProduction ? 'false' : 'true')

      return <T>JSON.parse(content)
    } catch (e) {
      throw new FatalError(e, `Error reading configuration file "${fileName}"`)
    }
  }
}

import { inject, injectable } from 'inversify'

import { TYPES } from '../misc/types'
import GhostService from '../services/ghost/service'
import { FatalError } from '../Errors'

import { BotConfig } from './bot.config'
import { BotpressConfig } from './botpress.config'
import { ModulesConfig } from './modules.config'

export interface ConfigProvider {
  getBotpressConfig(): Promise<BotpressConfig>
  getModulesConfig(): Promise<ModulesConfig>
  getBotConfig(botId: string): Promise<BotConfig>
  setBotConfig(botId: string, config: BotConfig): Promise<void>
}

@injectable()
export class GhostConfigProvider implements ConfigProvider {
  constructor(
    @inject(TYPES.GhostService) private ghostService: GhostService,
    @inject(TYPES.ProjectLocation) private projectLocation: string
  ) {}

  async getBotpressConfig(): Promise<BotpressConfig> {
    const config = await this.getConfig<BotpressConfig>('botpress.config.json')

    const host = process.env.BP_HOST || config.httpServer.host
    config.httpServer.host = host === 'localhost' ? undefined : host

    return config
  }

  async getModulesConfig(): Promise<ModulesConfig> {
    return this.getConfig<ModulesConfig>('modules.config.json')
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
      content = content.replace('%BOTPRESS_DIR%', this.projectLocation)

      return <T>JSON.parse(content)
    } catch (e) {
      throw new FatalError(e, `Error reading configuration file "${fileName}"`)
    }
  }
}

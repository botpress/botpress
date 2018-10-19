import { Logger } from 'botpress/sdk'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'

import { BotConfig } from './config/bot.config'
import { ConfigProvider } from './config/config-loader'
import Database from './database'
import { GhostService } from './services'
import { CMSService } from './services/cms/cms-service'
import { TYPES } from './types'

@injectable()
export class BotLoader {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'BotLoader')
    private logger: Logger,
    @inject(TYPES.CMSService) private cms: CMSService,
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider
  ) {}

  public async getAllBotIds(): Promise<string[]> {
    return this.database
      .knex('srv_bots')
      .select('id')
      .then<any[]>()
      .map(x => x['id'] as string)
  }

  public async getAllBots(): Promise<Map<string, BotConfig>> {
    const botIds = await this.getAllBotIds()
    const bots = new Map<string, BotConfig>()

    for (const botId of botIds) {
      try {
        bots.set(botId, await this.configProvider.getBotConfig(botId))
      } catch (err) {
        this.logger.attachError(err).error(`Bot configuration file not found for bot "${botId}"`)
      }
    }

    return bots
  }

  async loadAllBots() {
    const bots = await this.getAllBots()
    await this.cms.preloadContentForAllBots(Array.from(bots.keys()))
  }

  async loadForBot(botId: string) {
    await this.cms.loadContentElementsForBot(botId)
  }
}

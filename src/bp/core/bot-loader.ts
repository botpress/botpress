import { Logger } from 'botpress/sdk'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'

import { BotConfig } from './config/bot.config'
import { ConfigProvider } from './config/config-loader'
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
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider
  ) {}

  public async getAllBots(): Promise<Map<string, BotConfig>> {
    const botIds = ['bot123'] // TODO FIXME Pull bot Ids from the database
    const bots = new Map<string, BotConfig>()

    for (const botId of botIds) {
      bots.set(botId, await this.configProvider.getBotConfig(botId))
    }

    return bots
  }

  async loadAllBots() {
    const bots = await this.getAllBots()
    await this.cms.preloadContentForAllBots(Array.from(bots.keys()))
  }
}

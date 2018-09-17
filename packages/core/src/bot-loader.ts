import { Logger } from 'botpress-module-sdk'
import { inject, injectable, tagged } from 'inversify'
import path from 'path'
import plur from 'plur'

import { BotConfig } from './config/bot.config'
import { ConfigProvider } from './config/config-loader'
import { TYPES } from './misc/types'
import { CMSService } from './services/cms/cms-service'
import GhostService from './services/ghost/service'

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
    const botConfigs = await this.ghost.forAllBots().directoryListing('./', 'bot.config.json')
    const botIds = botConfigs.map(x => x.split(path.sep)[0])
    const bots = new Map<string, BotConfig>()
    await Promise.each(botIds, async botId => bots.set(botId, await this.configProvider.getBotConfig(botId)))
    return bots
  }

  async loadAllBots() {
    const bots = await this.getAllBots()

    const elements = await Promise.map(bots.keys(), bot => this.cms.loadContentElementsForBot(bot))
    this.logger.info(`Loaded ${elements[0].length} ${plur('element', elements[0].length)}`)
  }
}

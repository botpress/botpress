import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import plur from 'plur'

import { BotConfig } from './config/bot.config'
import { ConfigProvider } from './config/config-loader'
import { TYPES } from './types'
import { CMSService } from './services/cms/cms-service'
import { GhostService } from './services'
import { Logging } from 'bp/common'

@injectable()
export class BotLoader {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'BotLoader')
    private logger: Logging.Logger,
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

    const elements = await Promise.map(bots.keys(), bot => this.cms.loadContentElementsForBot(bot))
    this.logger.info(`Loaded ${elements[0].length} ${plur('element', elements[0].length)}`)
  }
}

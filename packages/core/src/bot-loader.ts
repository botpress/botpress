import { Logger } from 'botpress-module-sdk'
import { inject, injectable, postConstruct, tagged } from 'inversify'
import { Memoize } from 'lodash-decorators'
import path from 'path'
import plur from 'plur'

import { IDisposeOnExit } from './misc/interfaces'

import { BotConfig } from './config/bot.config'
import { ConfigProvider } from './config/config-loader'
import { TYPES } from './misc/types'
import ActionService from './services/action/action-service'
import { CMSService } from './services/cms/cms-service'
import FlowService from './services/dialog/flow-service'
import GhostService from './services/ghost/service'

@injectable()
export class BotLoader {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'BotLoader')
    private logger: Logger,
    @inject(TYPES.CMSService) private cms: CMSService,
    @inject(TYPES.GhostService) private ghost: GhostService,
    @inject(TYPES.FlowService) private flowService: FlowService,
    @inject(TYPES.ActionService) private actionService: ActionService,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider
  ) {}

  @postConstruct()
  async initialize() {}

  @Memoize
  public async getAllBots(): Promise<Map<string, BotConfig>> {
    const botConfigs = await this.ghost.forAllBots().directoryListing('./', 'bot.config.json')
    const botIds = botConfigs.map(x => x.split(path.sep)[0])
    const bots = new Map<string, BotConfig>()
    await Promise.each(botIds, async botId => bots.set(botId, await this.configProvider.getBotConfig(botId)))
    return bots
  }

  async loadAllBots() {
    const bots = await this.getAllBots()

    const flowViews = await Promise.map(bots.keys(), bot => this.flowService.loadAll(bot))
    this.logger.info(`Loaded ${flowViews.length} ${plur('flow', flowViews.length)}`)

    const elements = await Promise.map(bots.keys(), bot => this.cms.loadContentElementsForBot(bot))
    this.logger.info(`Loaded ${elements[0].length} ${plur('element', elements[0].length)}`)

    const actions = await Promise.reduce(
      // Just for testing, remove that after successful implementation
      // We don't actually want to load all bot's actions upfront
      bots.keys(),
      async (acc, bot) => {
        const a = await this.actionService.forBot(bot).listActions()
        return acc + a.length
      },
      0
    )

    this.logger.info(`Loaded ${actions} actions`)
  }
}

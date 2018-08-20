import { inject, injectable, tagged } from 'inversify'
import plur from 'plur'

import { ConfigProvider } from './config/config-loader'
import { Logger } from './misc/interfaces'
import { TYPES } from './misc/types'
import ActionService from './services/action/action-service'
import { CMSService } from './services/cms/cms-service'
import FlowService from './services/dialog/flow-service'

@injectable()
export class BotLoader {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'BotLoader')
    private logger: Logger,
    @inject(TYPES.CMSService) private cms: CMSService,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.FlowService) private flowService: FlowService,
    @inject(TYPES.ActionService) private actionService: ActionService
  ) {}

  async loadAllBots() {
    const botpressConfig = await this.configProvider.getBotpressConfig()
    const bots = botpressConfig.bots

    const flowViews = await Promise.map(bots, bot => this.flowService.loadAll(bot))
    this.logger.info(`Loaded ${flowViews.length} ${plur('flow', flowViews.length)}`)

    const elements = await Promise.map(bots, bot => this.cms.loadContentElementsForBot(bot))
    this.logger.info(`Loaded ${elements[0].length} ${plur('element', elements[0].length)}`)

    const actions = await Promise.reduce(
      // Just for testing, remove that after successful implementation
      // We don't actually want to load all bot's actions upfront
      bots,
      async (acc, bot) => {
        const a = await this.actionService.forBot(bot).listActions()
        return acc + a.length
      },
      0
    )

    this.logger.info(`Loaded ${actions} actions`)
  }
}

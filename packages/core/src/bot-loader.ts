import { inject, injectable, tagged } from 'inversify'

import { ConfigProvider } from './config/config-loader'
import { Logger } from './misc/interfaces'
import { TYPES } from './misc/types'
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
    @inject(TYPES.FlowService) private flowService: FlowService
  ) {}

  async loadAllBots() {
    const botpressConfig = await this.configProvider.getBotpressConfig()
    const bots = botpressConfig.bots

    const flowViews = await Promise.map(bots, bot => this.flowService.loadAll(bot))
    this.logger.debug(`Loaded ${flowViews.length} ${flowViews.length === 1 ? 'flow' : 'flows'}`) // info?

    const elements = await Promise.map(bots, bot => this.cms.loadContentElementsForBot(bot))
    this.logger.debug(`Loaded ${elements[0].length} ${elements[0].length === 1 ? 'element' : 'elements'}`) // info?
  }
}

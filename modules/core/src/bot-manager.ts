import { inject, injectable, tagged } from 'inversify'

import { ConfigProvider } from './config/config-loader'
import { Logger } from './misc/interfaces'
import { TYPES } from './misc/types'
import { FlowProvider } from './services/dialog'
import { GhostContentService } from './services/ghost-content'

@injectable()
export class BotManager {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'BotManager')
    private logger: Logger,
    @inject(TYPES.GhostService) private ghost: GhostContentService,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.FlowProvider) private flowProvider: FlowProvider
  ) {}

  async loadAllBots() {
    const botpressConfig = await this.configProvider.getBotpressConfig()
    const bots = botpressConfig.bots
    this.logger.debug('Loading bots')

    const flowViews = await Promise.map(bots, bot => this.flowProvider.loadAll(bot))

    this.logger.debug(`Loaded ${flowViews.length} ${flowViews.length === 1 ? 'bot' : 'bots'}`)
  }
}

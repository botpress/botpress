import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import { Memoize } from 'lodash-decorators'
import moment from 'moment'
import ms from 'ms'

import { BotLoader } from '../../bot-loader'
import { BotpressConfig } from '../../config/botpress.config'
import { ConfigProvider } from '../../config/config-loader'
import { TYPES } from '../../types'
import { Janitor } from '../janitor'

import { DialogEngine } from './engine'
import { SessionService } from './session/service'
import { Logging } from 'bp/common'

@injectable()
export class DialogJanitor extends Janitor {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'DialogJanitor')
    protected logger: Logging.Logger,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.DialogEngine) private dialogEngine: DialogEngine,
    @inject(TYPES.BotLoader) private botLoader: BotLoader,
    @inject(TYPES.SessionService) private sessionService: SessionService
  ) {
    super(logger)
  }

  @Memoize
  private async getBotpresConfig(): Promise<BotpressConfig> {
    return this.configProvider.getBotpressConfig()
  }

  protected async getInterval(): Promise<string> {
    const config = await this.getBotpresConfig()
    return config.dialog.janitorInterval
  }

  protected async runTask(): Promise<void> {
    // Bot config can change at runtime
    const botpressConfig = await this.getBotpresConfig()
    const botsConfigs = await this.botLoader.getAllBots()
    const botsIds = Array.from(botsConfigs.keys())
    Promise.map(botsIds, async botId => {
      const botsConfigs = await this.botLoader.getAllBots()
      const botConfig = botsConfigs.get(botId)
      const expiryTime = ms(botConfig!.dialog!.timeoutInterval) || ms(botpressConfig.dialog.timeoutInterval)
      const outdatedDate = moment()
        .subtract(expiryTime, 'ms')
        .toDate()

      const sessionsIds = await this.sessionService.getStaleSessionsIds(botId, outdatedDate)
      if (sessionsIds.length > 0) {
        this.logger.forBot(botId).debug(`🔎 Found inactive sessions: ${sessionsIds.join(', ')}`)
      }

      Promise.map(sessionsIds, async id => {
        try {
          await this.dialogEngine.processTimeout(botId, id)
        } catch (err) {
          await this.sessionService.deleteSession(id)
        }
      })
    })
  }
}

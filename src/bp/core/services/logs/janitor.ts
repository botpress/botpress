import { Logger } from 'botpress/sdk'
import { BotLoader } from 'core/bot-loader'
import { BotpressConfig } from 'core/config/botpress.config'
import { ConfigProvider } from 'core/config/config-loader'
import { TYPES } from 'core/types'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import { Memoize } from 'lodash-decorators'
import moment from 'moment'
import ms from 'ms'

import { Janitor } from '../janitor'

import { LogsService } from './service'

@injectable()
export class LogsJanitor extends Janitor {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'LogsJanitor')
    protected logger: Logger,
    @inject(TYPES.LogsService) private logsService: LogsService,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.BotLoader) private botLoader: BotLoader
  ) {
    super(logger)
  }

  @Memoize
  private async getBotpresConfig(): Promise<BotpressConfig> {
    return this.configProvider.getBotpressConfig()
  }

  protected async getInterval(): Promise<string> {
    const config = await this.getBotpresConfig()
    return config.logs.janitorInterval
  }

  protected async runTask(): Promise<void> {
    if (process.env.DEBUG_LOGGER) {
      this.logger.debug('Cleaning up logs')
    }

    const botpressConfig = await this.getBotpresConfig()
    const botsConfigs = await this.botLoader.getAllBots()
    const botsIds = Array.from(botsConfigs.keys())
    const globalLogsExpiryTime = ms(botpressConfig.logs.expiration)

    Promise.mapSeries(botsIds, botId => {
      const botConfig = botsConfigs.get(botId)!
      const expiration = moment()
        .subtract(ms(_.get(botConfig, 'logs.expiration') || globalLogsExpiryTime))
        .toDate()
      this.logsService.deleteExpiredLogs(botId, expiration)
    })
  }
}

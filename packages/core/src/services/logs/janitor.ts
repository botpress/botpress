import { Logger } from 'botpress-module-sdk'
import { inject, injectable, tagged } from 'inversify'
import { Memoize } from 'lodash-decorators'
import moment from 'moment'
import ms from 'ms'

import { BotpressConfig } from '../../config/botpress.config'
import { ConfigProvider } from '../../config/config-loader'
import { TYPES } from '../../misc/types'
import { Janitor } from '../janitor'

import { LogsService } from './service'

@injectable()
export class LogsJanitor extends Janitor {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'LogsJanitor')
    protected logger: Logger,
    @inject(TYPES.LogsService) private logsService: LogsService,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider
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

    const config = await this.getBotpresConfig()
    const expiration = moment()
      .subtract(ms(config!.logs.expiration))
      .toDate()
    this.logsService.deleteExpiredLogs(expiration)
  }
}

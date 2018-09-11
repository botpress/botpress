import { Logger } from 'botpress-module-sdk'
import { inject, injectable, tagged } from 'inversify'
import moment from 'moment'
import ms from 'ms'

import { ConfigProvider } from '../../config/config-loader'
import Database from '../../database'
import { TYPES } from '../../misc/types'
import { JanitorRunner } from '../janitor'

import { LogsService } from './service'

@injectable()
export class LogJanitorRunner extends JanitorRunner {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'LogsJanitor')
    protected logger: Logger,
    @inject(TYPES.LogsService) private logsService: LogsService,
    @inject(TYPES.Database) protected database: Database,
    @inject(TYPES.ConfigProvider) protected configProvider: ConfigProvider
  ) {
    super(logger, database, configProvider)
  }

  async runTask() {
    if (process.env.DEBUG_LOGGER) {
      this.logger.debug('Cleaning up logs')
    }

    const config = await this.configProvider.getBotpressConfig()
    const expiration = moment()
      .subtract(ms(config!.logs.journey))
      .toDate()
    this.logsService.deleteExpiredLogs(expiration)
  }
}

import { Logger } from 'botpress-module-sdk'
import { inject, injectable, tagged } from 'inversify'
import moment from 'moment'
import ms from 'ms'

import { ConfigProvider } from '../config/config-loader'
import Database from '../database'
import { TYPES } from '../misc/types'
import { JanitorRunner } from '../services/janitor'
import { LogsService } from '../services/logs/service'

@injectable()
export class LogJanitorRunner extends JanitorRunner {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'LogsJanitor')
    protected logger: Logger,
    @inject(TYPES.Database) protected database: Database,
    @inject(TYPES.ConfigProvider) protected configProvider: ConfigProvider,
    @inject(TYPES.LogsService) private logsService: LogsService
  ) {
    super(logger, database, configProvider)
  }

  async runTask() {
    const config = await this.configProvider.getBotpressConfig()
    const expiration = moment()
      .subtract(ms(config!.logs.journey))
      .toDate()
    this.logsService.deleteExpiredLogs(expiration)
  }
}

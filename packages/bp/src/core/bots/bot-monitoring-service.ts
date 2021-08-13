import 'bluebird-global'
import { Logger, LoggerEntry } from 'botpress/sdk'
import { ConfigProvider } from 'core/config'
import { JobService, makeRedisKey } from 'core/distributed'
import { LogsRepository } from 'core/logger'
import { TYPES } from 'core/types'
import { inject, injectable, tagged } from 'inversify'
import { Redis } from 'ioredis'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'
import Redlock from 'redlock'

@injectable()
export class BotMonitoringService {
  private _redisClient?: Redis
  private _redlock!: Redlock
  private _keyMonitorLock = makeRedisKey('bot_monitor_lock')
  private _lock

  private _intervalRef: NodeJS.Timeout | undefined
  private _currentPromise
  private _lastBotMonitorCheckTs?: Date
  private _interval?: number

  public onBotError?: (botId: string, events: LoggerEntry[]) => Promise<void>

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'BotMonitoring')
    protected logger: Logger,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.LogsRepository) private logsRepo: LogsRepository,
    @inject(TYPES.JobService) private jobService: JobService
  ) {}

  async start() {
    const config = await this.configProvider.getBotpressConfig()
    if (!config?.botMonitoring?.enabled) {
      return
    }

    this._redisClient = this.jobService.getRedisClient()

    if (this._redisClient) {
      this._redlock = new Redlock([this._redisClient], {
        retryCount: 0,
        retryJitter: 200
      })
    }

    if (config.botMonitoring.interval && this.onBotError) {
      this._interval = ms(config.botMonitoring.interval)
      this._intervalRef = setInterval(() => this._checkBotMonitor(), this._interval)
    }
  }

  stop() {
    if (this._intervalRef) {
      clearInterval(this._intervalRef)
      this._intervalRef = undefined
    }
  }

  private _isLockAcquired = async () => {
    if (!this._redlock) {
      return true
    }

    try {
      const lockDuration = this._interval! + 5000
      if (this._lock) {
        await this._lock.extend(lockDuration)
      } else {
        this._lock = await this._redlock.lock(this._keyMonitorLock, lockDuration)
      }
      return true
    } catch (error) {
      this._lock = undefined
      return false
    }
  }

  private async _checkBotMonitor() {
    if (this._currentPromise || !(await this._isLockAcquired())) {
      return
    }

    const from =
      this._lastBotMonitorCheckTs ||
      moment()
        .subtract(this._interval)
        .toDate()

    this._lastBotMonitorCheckTs = new Date()

    this._currentPromise = this.logsRepo
      .getBotsErrorLogs(from, this._lastBotMonitorCheckTs)
      .then(async result => {
        const grouped = _.groupBy(result, r => r.botId)

        for (const botId in grouped) {
          await this.onBotError!(botId, grouped[botId])
        }
      })
      .catch(err => {
        this.logger.attachError(err).error('Error while processing logs for hook onBotError')
      })
      .finally(() => {
        this._currentPromise = undefined
      })
  }
}

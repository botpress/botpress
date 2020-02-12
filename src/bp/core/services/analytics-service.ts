import { Analytics, Logger, MetricDefinition } from 'botpress/sdk'
import { ConfigProvider } from 'core/config/config-loader'
import { AnalyticsRepository } from 'core/repositories/analytics-repository'
import { TYPES } from 'core/types'
import { inject, injectable, tagged } from 'inversify'
import ms from 'ms'

@injectable()
export default class AnalyticsService {
  private readonly BATCH_SIZE = 100

  private batch: MetricDefinition[] = []
  private enabled = false
  private interval!: number
  private intervalRef
  private currentPromise

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'AnalyticsService')
    private logger: Logger,
    @inject(TYPES.AnalyticsRepository) private analyticsRepo: AnalyticsRepository,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider
  ) {}

  async initialize() {
    const config = (await this.configProvider.getBotpressConfig()).analytics
    if (!config || !config.enabled) {
      return
    }

    this.interval = ms(config.interval)
    this.enabled = config.enabled
  }

  start() {
    if (this.intervalRef || !this.enabled) {
      return
    }
    this.intervalRef = setInterval(this._runTask, this.interval)
  }

  addMetric(metricDef: MetricDefinition): void {
    if (!this.enabled) {
      return
    }

    this.batch.push(metricDef)
  }

  async getDateRange(botId: string, startDate: Date, endDate: Date, channel?: string): Promise<Analytics[]> {
    return this.analyticsRepo.getBetweenDates(botId, startDate, endDate, channel)
  }

  private _runTask = async () => {
    if (this.currentPromise || !this.batch.length) {
      return
    }

    const batchSize = Math.min(this.batch.length, this.BATCH_SIZE)
    const metrics = this.batch.splice(0, batchSize)
    this.currentPromise = this.analyticsRepo
      .insertMany(metrics)
      .catch(err => {
        this.logger.attachError(err).error('Could not persist metrics. Re-queuing now.')
        this.batch.push(...metrics)
      })
      .finally(() => {
        this.currentPromise = undefined
      })
  }
}

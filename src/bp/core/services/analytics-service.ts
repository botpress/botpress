import { Analytics, AnalyticsFn, Logger, MetricDefinition } from 'botpress/sdk'
import { ConfigProvider } from 'core/config/config-loader'
import { AnalyticsRepository } from 'core/repositories/analytics-repository'
import { TYPES } from 'core/types'
import { inject, injectable, tagged } from 'inversify'
import moment from 'moment'
import ms from 'ms'

export interface BatchObject {
  fn: AnalyticsFn
  metricDef: MetricDefinition
}

@injectable()
export default class AnalyticsService {
  private readonly BATCH_SIZE = 100

  private metricsBatch: BatchObject[] = []
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

  batch(fn: AnalyticsFn, metricDef: MetricDefinition) {
    if (!this.enabled) {
      return
    }

    this.metricsBatch.push({ fn, metricDef })
  }

  start() {
    if (this.intervalRef || !this.enabled) {
      return
    }
    this.intervalRef = setInterval(this._runTask, this.interval)
  }

  async incrementMetric(metricDef: MetricDefinition): Promise<void> {
    if (!this.enabled) {
      return
    }

    const { botId, channel, metric, increment = 1 } = metricDef

    try {
      const analytics = await this.analyticsRepo.get({ botId, channel, metric })
      const latest = moment(analytics.created_on).startOf('day')
      const today = moment().startOf('day')

      // Aggregate metrics per day
      if (latest.isBefore(today)) {
        await this.analyticsRepo.insert({ botId, channel, metric, value: increment })
      } else {
        await this.analyticsRepo.update(analytics.id, analytics.value + increment)
      }
    } catch (err) {
      await this.analyticsRepo.insert({ botId, channel, metric, value: increment })
    }
  }

  async incrementMetricTotal(metricDef: MetricDefinition): Promise<void> {
    if (!this.enabled) {
      return
    }

    const { botId, channel, metric, increment = 1 } = metricDef

    try {
      const analytics = await this.analyticsRepo.get({ botId, channel, metric })
      const latest = moment(analytics.created_on).startOf('day')
      const today = moment().startOf('day')

      // Aggregate metrics per day
      if (latest.isBefore(today)) {
        await this.analyticsRepo.insert({ botId, channel, metric, value: analytics.value + increment })
      } else {
        await this.analyticsRepo.update(analytics.id, analytics.value + increment)
      }
    } catch (err) {
      await this.analyticsRepo.insert({ botId, channel, metric, value: increment })
    }
  }

  async getDateRange(botId: string, startDate: Date, endDate: Date, channel?: string): Promise<Analytics[]> {
    return this.analyticsRepo.getBetweenDates(botId, startDate, endDate, channel)
  }

  private _runTask = async () => {
    if (this.currentPromise || !this.metricsBatch.length) {
      return
    }

    const batchSize = Math.min(this.metricsBatch.length, this.BATCH_SIZE)
    for (let i = 0; i < batchSize; i++) {
      const metric = this.metricsBatch.shift()
      this.currentPromise = metric?.fn
        .call(this, metric.metricDef)
        .catch(err => {
          this.logger.attachError(err).error('Could not persist metrics. Re-queuing now.')
          this.metricsBatch.push(metric)
        })
        .finally(() => {
          this.currentPromise = undefined
        })
    }
  }
}

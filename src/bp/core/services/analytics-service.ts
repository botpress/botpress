import sdk, { Analytics, AnalyticsMethod, AnalyticsMetric, Logger, MetricDefinition } from 'botpress/sdk'
import { ConfigProvider } from 'core/config/config-loader'
import { EventRepository } from 'core/repositories'
import { AnalyticsRepository } from 'core/repositories/analytics-repository'
import { TYPES } from 'core/types'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
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
    @inject(TYPES.EventRepository) private eventRepo: EventRepository,
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
    const todaysEvents = await this.eventRepo.findByDate(new Date())
    await this.compileFeedbackMetrics(todaysEvents)
    await this.compileUsersCountMetric(todaysEvents)

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

  private setQnaFeedbackCount(botId, channel, feedback, count) {
    const metric = feedback > 0 ? AnalyticsMetric.FeedbackPositiveQna : AnalyticsMetric.FeedbackNegativeQna
    this.addMetric({
      botId,
      channel,
      metric,
      method: AnalyticsMethod.Replace,
      increment: count
    })
  }

  private setGoalFeedbackCount(botId, channel, feedback, count) {
    const metric = feedback > 0 ? AnalyticsMetric.FeedbackPositiveGoal : AnalyticsMetric.FeedbackNegativeGoal
    this.addMetric({
      botId,
      channel,
      metric,
      method: AnalyticsMethod.Replace,
      increment: count
    })
  }

  private async compileFeedbackMetrics(events: sdk.IO.StoredEvent[]): Promise<void> {
    const incomingEvents = events.filter(e => e.direction === 'incoming')

    _.chain(incomingEvents)
      .filter(e => !e.goalId && e.feedback)
      .groupBy((e: sdk.IO.StoredEvent) => `${e.botId}-${e.channel}-${e.feedback}`)
      .forEach((value, _) =>
        this.setQnaFeedbackCount(value[0]['botId'], value[0]['channel'], value[0]['feedback'], value.length)
      )
      .value()

    _.chain(incomingEvents)
      .filter(e => e.goalId && e.feedback)
      .groupBy((e: sdk.IO.StoredEvent) => `${e.botId}-${e.channel}-${e.feedback}`)
      .forEach((value, _) =>
        this.setGoalFeedbackCount(value[0]['botId'], value[0]['channel'], value[0]['feedback'], value.length)
      )
      .value()
  }

  private async compileUsersCountMetric(events: sdk.IO.StoredEvent[]) {
    _.chain(events)
      .groupBy(e => `${e.botId}-${e.channel}-${e.target}`)
      .forEach((value, _) => {
        this.addMetric({
          botId: value[0]['botId'],
          channel: value[0]['channel'],
          metric: AnalyticsMetric.ActiveUsers,
          method: AnalyticsMethod.Replace
        })
      })
      .value()
  }
}

import sdk, { AnalyticsMethod, AnalyticsMetric, BotConfig, MetricDefinition } from 'botpress/sdk'
import _ from 'lodash'
import ms from 'ms'

import { Analytics } from '..'
import { Config } from '../config'

import { AnalyticsDatabase } from './db'

export default class AnalyticsService {
  private readonly BATCH_SIZE = 100

  private batch: MetricDefinition[] = []
  private botConfigs: Map<string, Config> = new Map()
  private enabled = false
  private interval!: number
  private intervalRef
  private currentPromise

  constructor(private bp: typeof sdk, private db: AnalyticsDatabase) {}

  async initialize() {
    const config = (await this.bp.config.getModuleConfig('analytics-v2')) as Config
    if (!config || !config.enabled) {
      return
    }

    this.interval = ms(config.interval as string)
    this.enabled = config.enabled
  }

  start() {
    if (this.intervalRef || !this.enabled) {
      return
    }
    this.intervalRef = setInterval(this._runTask, this.interval)
  }

  async addMetric(metricDef: MetricDefinition): Promise<void> {
    if (!this.botConfigs.has(metricDef.botId)) {
      const botConfig = (await this.bp.config.getModuleConfigForBot('analytics-v2', metricDef.botId)) as Config
      this.botConfigs.set(metricDef.botId, botConfig)
    }

    if (this.enabled || this.botConfigs.get(metricDef.botId).enabled) {
      this.batch.push(metricDef)
    }
  }

  async addUserMetric(botId, channel): Promise<void> {
    await this.addMetric({
      botId,
      channel,
      metric: AnalyticsMetric.NewUsersCount,
      method: AnalyticsMethod.IncrementDaily
    })
    await this.addMetric({
      botId,
      channel,
      metric: AnalyticsMetric.TotalUsers,
      method: AnalyticsMethod.IncrementTotal
    })
  }

  async getDateRange(botId: string, startDate: Date, endDate: Date, channel?: string): Promise<Analytics[]> {
    return this.db.getBetweenDates(botId, startDate, endDate, channel)
  }

  private _runTask = async () => {
    const todaysEvents = await this.bp.events.findByDate(new Date())
    await this.compileFeedbackMetrics(todaysEvents)
    await this.compileUsersCountMetric(todaysEvents)

    if (this.currentPromise || !this.batch.length) {
      return
    }

    const batchSize = Math.min(this.batch.length, this.BATCH_SIZE)
    const metrics = this.batch.splice(0, batchSize)
    this.currentPromise = this.db
      .insertMany(metrics)
      .catch(err => {
        this.bp.logger.attachError(err).error('Could not persist metrics. Re-queuing now.')
        this.batch.push(...metrics)
      })
      .finally(() => {
        this.currentPromise = undefined
      })
  }

  private async setQnaFeedbackCount(botId, channel, feedback, count): Promise<void> {
    const metric = feedback > 0 ? AnalyticsMetric.FeedbackPositiveQna : AnalyticsMetric.FeedbackNegativeQna
    return this.addMetric({
      botId,
      channel,
      metric,
      method: AnalyticsMethod.Replace,
      increment: count
    })
  }

  private async setGoalFeedbackCount(botId, channel, feedback, count): Promise<void> {
    const metric = feedback > 0 ? AnalyticsMetric.FeedbackPositiveGoal : AnalyticsMetric.FeedbackNegativeGoal
    return this.addMetric({
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
      .forEach(
        async (value, _) =>
          await this.setQnaFeedbackCount(value[0]['botId'], value[0]['channel'], value[0]['feedback'], value.length)
      )
      .value()

    _.chain(incomingEvents)
      .filter(e => e.goalId && e.feedback)
      .groupBy((e: sdk.IO.StoredEvent) => `${e.botId}-${e.channel}-${e.feedback}`)
      .forEach(
        async (value, _) =>
          await this.setGoalFeedbackCount(value[0]['botId'], value[0]['channel'], value[0]['feedback'], value.length)
      )
      .value()
  }

  private async compileUsersCountMetric(events: sdk.IO.StoredEvent[]) {
    _.chain(events)
      .groupBy(e => `${e.botId}-${e.channel}-${e.target}`)
      .forEach(async (value, _) => {
        await this.addMetric({
          botId: value[0]['botId'],
          channel: value[0]['channel'],
          metric: AnalyticsMetric.ActiveUsers,
          method: AnalyticsMethod.Replace
        })
      })
      .value()
  }
}

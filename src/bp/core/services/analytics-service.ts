import { AnalyticsRepository, MetricName } from 'core/repositories/analytics-repository'
import { injectable } from 'inversify'
import moment from 'moment'

@injectable()
export default class AnalyticsService {
  constructor(private repo: AnalyticsRepository) {}

  async incrementMetric(botId: string, channel: string, metric: MetricName) {
    try {
      const analytic = await this.repo.get({ botId, channel, metric })
      const latest = moment(analytic.created_on).startOf('day')
      const today = moment().startOf('day')

      // Aggregate metrics per day
      if (latest.isBefore(today)) {
        await this.repo.insert({ botId, channel, metric, value: 1 })
      } else {
        await this.repo.update(analytic.id, analytic.value + 1)
      }
    } catch (err) {
      await this.repo.insert({ botId, channel, metric, value: 1 })
    }
  }

  async getDateRange(botId: string, startDate: string, endDate: string, channel?: string) {
    return this.repo.getBetweenDates(botId, this.formatTextDate(startDate), this.formatTextDate(endDate), channel)
  }

  private formatTextDate(text: string) {
    const momentDate = moment(text, 'MM-DD-YYYY')
    if (!momentDate.isValid()) {
      throw new Error(`Invalid date format ${text}. Please use 'mm-dd-yyyy' instead.`)
    }

    return momentDate.toISOString()
  }
}

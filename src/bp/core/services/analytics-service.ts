import { AnalyticsRepository, MetricName } from 'core/repositories/analytics-repository'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import moment from 'moment'

@injectable()
export default class AnalyticsService {
  constructor(@inject(TYPES.AnalyticsRepository) private analyticsRepo: AnalyticsRepository) {}

  async incrementMetric(botId: string, channel: string, metric: MetricName, increment = 1) {
    try {
      const analytic = await this.analyticsRepo.get({ botId, channel, metric })
      const latest = moment(analytic.created_on).startOf('day')
      const today = moment().startOf('day')

      // Aggregate metrics per day
      if (latest.isBefore(today)) {
        await this.analyticsRepo.insert({ botId, channel, metric, value: increment })
      } else {
        await this.analyticsRepo.update(analytic.id, analytic.value + increment)
      }
    } catch (err) {
      await this.analyticsRepo.insert({ botId, channel, metric, value: increment })
    }
  }

  async getDateRange(botId: string, startDate: string, endDate: string, channel?: string) {
    const analytics = await this.analyticsRepo.getBetweenDates(
      botId,
      this.formatUnixToISO(startDate),
      this.formatUnixToISO(endDate),
      channel
    )
    return analytics
  }

  private formatUnixToISO(unix) {
    const momentDate = moment.unix(unix)
    if (!momentDate.isValid()) {
      throw new Error(`Invalid unix timestamp format ${unix}.`)
    }

    return momentDate.toISOString()
  }
}

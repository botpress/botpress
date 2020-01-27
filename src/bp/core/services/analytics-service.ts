import { AnalyticsRepository, MetricName } from 'core/repositories/analytics-repository'
import { injectable } from 'inversify'
import moment from 'moment'

@injectable()
export default class AnalyticsService {
  constructor(private repository: AnalyticsRepository) {}

  async incrementMetric(botId: string, channel: string, metric: MetricName) {
    try {
      const analytic = await this.repository.get({ botId, channel, metric })
      const latest = moment(analytic.created_on).startOf('day')
      const today = moment().startOf('day')

      // Aggregate metrics per day
      if (latest.isBefore(today)) {
        await this.repository.insert({ botId, channel, metric, value: 1 })
      } else {
        await this.repository.update(analytic.id, analytic.value + 1)
      }
    } catch (err) {
      await this.repository.insert({ botId, channel, metric, value: 1 })
    }
  }
}

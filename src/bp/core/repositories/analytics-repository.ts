import { Analytics, MetricName } from 'botpress/sdk'
import Database from 'core/database'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import moment from 'moment'

const TABLE_NAME = 'srv_analytics'

@injectable()
export class AnalyticsRepository {
  constructor(@inject(TYPES.Database) private db: Database) {}

  async insert(args: { botId: string; channel: string; metric: MetricName; value: number }) {
    const { botId, channel, metric, value } = args
    await this.db
      .knex(TABLE_NAME)
      .insert({ botId, channel, metric_name: metric, value, created_on: this.db.knex.date.now() })
  }

  async update(id: number, value: number): Promise<void> {
    await this.db
      .knex(TABLE_NAME)
      .update({ value, updated_on: this.db.knex.date.now() })
      .where({ id })
  }

  async get(args: { botId: string; channel: string; metric: string }): Promise<Analytics> {
    const { botId, channel, metric } = args
    const analytics: Analytics = await this.db
      .knex(TABLE_NAME)
      .select()
      .where({ botId, channel, metric_name: metric })
      .orderBy('created_on', 'desc')
      .first()

    if (!analytics) {
      throw new Error(`Could not find analytics for ${botId}-${channel}-${metric}`)
    }

    return analytics
  }

  async getBetweenDates(botId: string, startDate: Date, endDate: Date, channel?: string): Promise<Analytics[]> {
    const includeEndDate = moment(endDate).add(1, 'day')

    let query = this.db
      .knex(TABLE_NAME)
      .select()
      .whereBetween('created_on', [startDate.toISOString(), includeEndDate.toISOString()])
      .andWhere({ botId })

    if (channel) {
      query = query.andWhere({ channel })
    }

    // nested promises
    return await query
  }
}

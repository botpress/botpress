import Database from 'core/database'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'

const TABLE_NAME = 'srv_analytics'

export interface Analytics {
  id: number
  botId: string
  metric_name: string
  channel: string
  created_on: string
  updated_on: string
  value: number
}

export type MetricName =
  | 'sessions_count'
  | 'msg_received_count'
  | 'goals_started_count'
  | 'goals_completed_count'
  | 'goals_failed_count'
  | 'msg_sent_count'
  | 'msg_sent_qna_count'
  | 'users_new_count'
  | 'msg_nlu_none'
  | 'sessions_start_nlu_none'

@injectable()
export class AnalyticsRepository {
  constructor(@inject(TYPES.Database) private db: Database) {}

  async insert(args: { botId: string; channel: string; metric: string; value: number }) {
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

  async getBetweenDates(botId: string, startDate: string, endDate: string, channel?: string): Promise<Analytics[]> {
    let query = this.db
      .knex(TABLE_NAME)
      .select()
      .whereBetween('created_on', [startDate, endDate])
      .andWhere({ botId })

    if (channel) {
      query = query.andWhere({ channel })
    }

    // nested promises
    return await query
  }
}

import Database from 'core/database'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import { isNumber } from 'util'

const TABLE_NAME = 'srv_analytics'

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

  async incrementMetric(botId: string, channel: string, metric: MetricName): Promise<void> {
    const row = await this.db
      .knex(TABLE_NAME)
      .select('value')
      .where({ botId, channel, metric_name: metric })
      .first()

    if (!row) {
      await this.db
        .knex(TABLE_NAME)
        .insert({ botId, channel, metric_name: metric, value: 1, created_on: this.db.knex.date.now() })
    } else {
      await this.db
        .knex(TABLE_NAME)
        .update({ value: row.value + 1, updated_on: this.db.knex.date.now() })
        .where({ botId, metric_name: metric })
    }
  }

  async get(botId: string, channel: string, metric: string): Promise<number> {
    const row = await this.db
      .knex(TABLE_NAME)
      .select('value')
      .where({ botId, channel, metric_name: metric })
      .first()

    if (!row) {
      throw new Error(`Could not find analytics for ${botId}-${channel}-${metric}`)
    }

    return row.value
  }

  async getByChannel(botId: string, channel: string) {
    const metrics = await this.db
      .knex(TABLE_NAME)
      .select('*')
      .where({ botId, channel })
  }
}

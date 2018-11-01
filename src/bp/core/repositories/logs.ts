import { inject, injectable } from 'inversify'

import Database from '../database'
import { TYPES } from '../types'

export interface LogsRepository {
  deleteBeforeDate(botId: string, date: Date)
  getByBot(botId: string, limit?: number)
}

@injectable()
export class KnexLogsRepository implements LogsRepository {
  private readonly TABLE_NAME = 'srv_logs'
  private readonly DEFAULT_LIMIT = 25

  constructor(@inject(TYPES.Database) private database: Database) {}

  async deleteBeforeDate(botId: string, date: Date): Promise<void> {
    await this.database
      .knex(this.TABLE_NAME)
      .where({ botId })
      .andWhere(this.database.knex.date.isBefore('timestamp', date))
      .del()
      .then()
  }

  async getByBot(botId: string, limit?: number) {
    return this.database
      .knex(this.TABLE_NAME)
      .select('*')
      .where({ botId })
      .limit(limit || this.DEFAULT_LIMIT)
      .then()
  }
}

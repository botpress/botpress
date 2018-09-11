import { inject, injectable } from 'inversify'

import Database from '../database'
import { TYPES } from '../misc/types'

export interface LogsRepository {
  deleteLogsBeforeDate(date: Date)
}

@injectable()
export class KnexLogsRepository implements LogsRepository {
  private readonly TABLE_NAME = 'srv_logs'

  constructor(@inject(TYPES.Database) private database: Database) {}

  async deleteLogsBeforeDate(date: Date): Promise<void> {
    await this.database.knex(this.TABLE_NAME).where(this.database.knex.date.isBefore('timestamp', date))
  }
}

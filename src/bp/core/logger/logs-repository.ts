import { LoggerEntry, LoggerLevel } from 'botpress/sdk'

import Database from 'core/database'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'

interface LogSearchParams {
  fromDate?: Date
  toDate?: Date
  botIds?: string[]
  level?: LoggerLevel
  start?: number
  count?: number
}

@injectable()
export class LogsRepository {
  private readonly TABLE_NAME = 'srv_logs'
  private readonly DEFAULT_LIMIT = 25
  private readonly MAX_ROW_COUNT = 2000

  constructor(@inject(TYPES.Database) private database: Database) {}

  async deleteBeforeDate(botId: string, date: Date): Promise<void> {
    await this.database
      .knex(this.TABLE_NAME)
      .where({ botId })
      .andWhere(this.database.knex.date.isBefore('timestamp', date))
      .del()
      .then()
  }

  async getByBot(botId: string, limit?: number): Promise<LoggerEntry[]> {
    return this.database
      .knex(this.TABLE_NAME)
      .select('*')
      .where({ botId })
      .limit(limit || this.DEFAULT_LIMIT)
      .then()
  }

  async getBotsErrorLogs(from: Date, to: Date): Promise<LoggerEntry[]> {
    return this.database
      .knex(this.TABLE_NAME)
      .select('*')
      .whereNotNull('botId')
      .whereIn('level', ['warn', 'error', 'critical'])
      .where(this.database.knex.date.isBetween('timestamp', from, to))
  }

  async searchLogs({
    level,
    botIds,
    fromDate,
    toDate,
    count = this.MAX_ROW_COUNT,
    start = 0
  }: LogSearchParams): Promise<LoggerEntry[]> {
    let query = this.database.knex(this.TABLE_NAME).select('*')

    if (fromDate && toDate) {
      query = query.where(this.database.knex.date.isBetween('timestamp', fromDate, toDate))
    }

    if (botIds) {
      query = query.whereIn('botId', botIds)
    }

    if (level) {
      query = query.where({ level })
    }

    return query
      .offset(start)
      .limit(count)
      .orderBy('timestamp', 'desc')
  }
}

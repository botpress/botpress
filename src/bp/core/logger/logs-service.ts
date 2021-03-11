import { LoggerEntry } from 'botpress/sdk'
import { inject, injectable } from 'inversify'

import { TYPES } from '../types'
import { LogsRepository } from './logs-repository'

@injectable()
export class LogsService {
  constructor(@inject(TYPES.LogsRepository) private logsRepository: LogsRepository) {}

  async deleteExpiredLogs(botId: string, date: Date): Promise<void> {
    await this.logsRepository.deleteBeforeDate(botId, date)
  }

  async getLogsForBot(botId: string, count?: number): Promise<LoggerEntry[]> {
    return this.logsRepository.getByBot(botId, count)
  }
}

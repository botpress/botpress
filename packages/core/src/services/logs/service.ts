import { LogEntry } from 'botpress-module-sdk'
import { inject, injectable } from 'inversify'

import { TYPES } from '../../misc/types'
import { LogsRepository } from '../../repositories/logs'

@injectable()
export class LogsService {
  constructor(@inject(TYPES.LogsRepository) private logsRepository: LogsRepository) {}

  async deleteExpiredLogs(botId: string, date: Date): Promise<void> {
    await this.logsRepository.deleteBeforeDate(botId, date)
  }

  async getLogsForBot(botId: string, count?: number): Promise<LogEntry[]> {
    return this.logsRepository.getByBot(botId, count)
  }
}

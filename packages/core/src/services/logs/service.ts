import { LogEntry } from 'botpress-module-sdk'
import { inject, injectable } from 'inversify'

import { TYPES } from '../../misc/types'
import { LogsRepository } from '../../repositories/logs'

@injectable()
export class LogsService {
  constructor(@inject(TYPES.LogsRepository) private logsRepository: LogsRepository) {}

  async deleteExpiredLogs(date: Date): Promise<void> {
    await this.logsRepository.deleteLogsBeforeDate(date)
  }

  async getLogs(count: number): Promise<LogEntry[]> {
    return this.logsRepository.getLimit(count)
  }
}

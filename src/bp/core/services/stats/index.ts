import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'

import { BotService } from '../bot-service'
import { JobService } from '../job-service'

const LOCK_RESOURCE = 'botpress:statsService'
@injectable()
export class StatsService {
  constructor(
    @inject(TYPES.JobService) private jobService: JobService,
    @inject(TYPES.BotService) private botService: BotService
  ) {}

  public start() {
    setInterval(this.run.bind(this), 5000)
  }

  private async run() {
    const lock = await this.jobService.acquireLock(LOCK_RESOURCE, 20000)
    if (lock) {
      await this.sendStats()
      await lock.unlock()
    }
  }

  private async sendStats() {
    console.log('Sending stats')
    const stats = await this.getStats()
    console.log('Stats:', stats)
  }

  private async getStats() {
    return {
      timestamp: new Date().toISOString(),
      botCount: (await this.botService.getBotsIds()).length,
      serverExternalUrl: process.EXTERNAL_URL || `http://${process.HOST}:${process.PORT}`
    }
  }
}

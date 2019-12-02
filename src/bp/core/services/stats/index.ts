import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'

import { JobService } from '../job-service'

const LOCK_RESOURCE = 'botpress:statsService'
@injectable()
export class StatsService {
  constructor(@inject(TYPES.JobService) private jobService: JobService) {}

  public start() {
    console.log('Stats Service Started!')

    setInterval(this.run.bind(this), 5000)
  }

  private async run() {
    const lock = await this.jobService.acquireLock(LOCK_RESOURCE, 20000)
    if (lock) {
      this.sendStats()
      await lock.unlock()
    }
  }

  private sendStats() {
    console.log('Sending stats')
  }
}

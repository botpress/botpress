import axios from 'axios'
import { inject, injectable } from 'inversify'
import ms from 'ms'
import yn from 'yn'

import { machineUUID } from '../../../common/stats'
import { ServerStats } from '../../../common/telemetry'
import { GhostService } from '../../bpfs'
import Database from '../../database'
import { JobService } from '../../distributed'
import { TYPES } from '../../types'
import { TelemetryRepository } from '../telemetry-repository'

const debug = DEBUG('telemetry')

export const DEFAULT = '***default***'
export const REDACTED = '***redacted***'

@injectable()
export abstract class TelemetryStats {
  protected abstract url: string
  protected abstract lock: string
  protected abstract interval: number

  constructor(
    @inject(TYPES.GhostService) protected ghostService: GhostService,
    @inject(TYPES.Database) protected database: Database,
    @inject(TYPES.JobService) private jobService: JobService,
    @inject(TYPES.TelemetryRepository) private telemetryRepo: TelemetryRepository
  ) {}

  public start() {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.run(this.lock, this.interval, this.url)

    setInterval(this.run.bind(this, this.lock, this.interval, this.url), this.interval)
  }

  protected abstract getStats()

  protected async run(lockResource: string, interval: number, url: string) {
    const lock = await this.jobService.acquireLock(lockResource, interval - ms('1 minute'))
    if (lock) {
      debug('Acquired lock')
      const stats = await this.getStats()
      await this.sendStats(url, stats)
    }
  }

  private async sendStats(url: string, stats) {
    try {
      debug('Sending stats: %o', JSON.stringify(stats))
      await axios.post(url, stats)
    } catch (err) {
      if (url === process.TELEMETRY_URL) {
        await this.telemetryRepo.insertPayload(stats.uuid, stats)
      }
    }
  }

  protected async getServerStats(): Promise<ServerStats> {
    return {
      isProduction: process.IS_PRODUCTION,
      externalUrl: process.EXTERNAL_URL,
      botpressVersion: process.BOTPRESS_VERSION,
      clusterEnabled: yn(process.CLUSTER_ENABLED, { default: false }),
      os: process.platform,
      bpfsStorage: process.BPFS_STORAGE,
      dbType: this.database.knex.isLite ? 'sqlite' : 'postgres',
      machineUUID: await machineUUID()
    }
  }
}

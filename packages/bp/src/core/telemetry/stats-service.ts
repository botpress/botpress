import { TYPES } from 'core/app/types'
import { JobService } from 'core/distributed'
import { inject, injectable } from 'inversify'
import ms from 'ms'

import { ConfigsStats } from './stats/configs-stats'
import { LegacyStats } from './stats/legacy-stats'
import { RolesStats } from './stats/roles-stats'
import { TelemetryRepository } from './telemetry-repository'

const DB_REFRESH_LOCK = 'botpress:telemetryDB'
const DB_REFRESH_INTERVAL = ms('15 minute')

@injectable()
export class StatsService {
  constructor(
    @inject(TYPES.JobService) private jobService: JobService,
    @inject(TYPES.TelemetryRepository) private telemetryRepo: TelemetryRepository,
    @inject(TYPES.LegacyStats) private legacyStats: LegacyStats,
    @inject(TYPES.RolesStats) private rolesStats: RolesStats,
    @inject(TYPES.ConfigsStats) private configStats: ConfigsStats
  ) {}

  public async start() {
    this.legacyStats.start()
    this.configStats.start()
    this.rolesStats.start()
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.refreshDB(DB_REFRESH_INTERVAL)

    setInterval(this.refreshDB.bind(this, DB_REFRESH_INTERVAL), DB_REFRESH_INTERVAL)
  }

  private async refreshDB(interval: number) {
    const lock = await this.jobService.acquireLock(DB_REFRESH_LOCK, interval - ms('1 minute'))
    if (lock) {
      await this.telemetryRepo.refreshAvailability()
    }
  }
}

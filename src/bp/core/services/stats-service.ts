import { TelemetryRepository } from 'core/repositories/telemetry'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import ms from 'ms'

import { JobService } from './job-service'
import { ActionsStats } from './telemetry/actions'
import { RolesStats } from './telemetry/custom-roles'
import { LegacyStats } from './telemetry/legacy-stats'
import { SDKStats } from './telemetry/sdk-methods'

const DB_REFRESH_LOCK = 'botpress:telemetryDB'
const DB_REFRESH_INTERVAL = ms('15 minute')

@injectable()
export class StatsService {
  constructor(
    @inject(TYPES.JobService) private jobService: JobService,
    @inject(TYPES.TelemetryRepository) private telemetryRepo: TelemetryRepository,
    @inject(TYPES.ActionStats) private actionStats: ActionsStats,
    @inject(TYPES.LegacyStats) private legacyStats: LegacyStats,
    @inject(TYPES.RolesStats) private rolesStats: RolesStats,
    @inject(TYPES.SDKStats) private sdkStats: SDKStats
  ) {}

  public async start() {
    await this.actionStats.start()
    await this.legacyStats.start()
    await this.rolesStats.start()
    await this.sdkStats.start()

    await this.refreshDB(DB_REFRESH_INTERVAL)
    setInterval(this.refreshDB.bind(this, DB_REFRESH_INTERVAL), DB_REFRESH_INTERVAL)
  }

  private async refreshDB(interval: number) {
    const lock = await this.jobService.acquireLock(DB_REFRESH_LOCK, interval - ms('1 minute'))
    if (lock) {
      await this.telemetryRepo.refreshAvailability()
    }
  }
}

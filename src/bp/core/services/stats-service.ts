import { TelemetryRepository } from 'core/repositories/telemetry'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import ms from 'ms'

import { JobService } from './job-service'
import { ActionsStats } from './telemetry/actions'
import { ConfigsStats } from './telemetry/configs'
import { HooksLifecycleStats } from './telemetry/hooks'
import { LegacyStats } from './telemetry/legacy-stats'
import { RolesStats } from './telemetry/roles-stats'
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
    @inject(TYPES.SDKStats) private sdkStats: SDKStats,
    @inject(TYPES.HooksStats) private hooksStats: HooksLifecycleStats,
    @inject(TYPES.ConfigsStats) private configStats: ConfigsStats
  ) {}

  public async start() {
    this.actionStats.start()
    this.legacyStats.start()
    this.hooksStats.start()
    this.configStats.start()
    this.rolesStats.start()
    this.sdkStats.start()
    // tslint:disable-next-line: no-floating-promises
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

import { TYPES } from 'core/app/types'
import { JobService } from 'core/distributed'
import { inject, injectable } from 'inversify'
import ms from 'ms'

import { ActionsStats } from './stats/actions-stats'
import { ConfigsStats } from './stats/configs-stats'
import { HooksStats } from './stats/hooks-stats'
import { LegacyStats } from './stats/legacy-stats'
import { MessageStats } from './stats/message-stats'
import { RolesStats } from './stats/roles-stats'
import { SDKStats } from './stats/sdk-stats'
import { UserStats } from './stats/user-stats'
import { TelemetryRepository } from './telemetry-repository'

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
    @inject(TYPES.HooksStats) private hooksStats: HooksStats,
    @inject(TYPES.ConfigsStats) private configStats: ConfigsStats,
    @inject(TYPES.UserStats) private userStats: UserStats,
    @inject(TYPES.MessageStats) private messageStats: MessageStats
  ) {}

  public async start() {
    this.actionStats.start()
    this.legacyStats.start()
    this.hooksStats.start()
    this.configStats.start()
    this.rolesStats.start()
    this.sdkStats.start()
    this.userStats.start()
    this.messageStats.start()
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

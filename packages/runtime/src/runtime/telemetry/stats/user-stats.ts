import { inject, injectable } from 'inversify'
import _ from 'lodash'
import ms from 'ms'

import { buildSchema } from '../../../common/telemetry'
import { GhostService } from '../../bpfs'
import Database from '../../database'
import { JobService } from '../../distributed'
import { MessagingService } from '../../messaging'
import { TYPES } from '../../types'
import { TelemetryRepository } from '../telemetry-repository'

import { TelemetryStats } from './telemetry-stats'

@injectable()
export class UserStats extends TelemetryStats {
  protected interval: number
  protected url: string
  protected lock: string

  constructor(
    @inject(TYPES.GhostService) ghostService: GhostService,
    @inject(TYPES.Database) database: Database,
    @inject(TYPES.JobService) jobService: JobService,
    @inject(TYPES.TelemetryRepository) telemetryRepo: TelemetryRepository,
    @inject(TYPES.MessagingService) private messagingService: MessagingService
  ) {
    super(ghostService, database, jobService, telemetryRepo)
    this.url = process.TELEMETRY_URL
    this.lock = 'botpress:telemetry-new-users'
    this.interval = ms('5m')
  }

  protected async getStats() {
    const newUsers = this.messagingService.getNewUsersCount({ resetCount: true })

    return {
      ...buildSchema(await this.getServerStats(), 'server'),
      event_type: 'new_users',
      event_data: {
        schema: '1.0.0',
        newUsers
      }
    }
  }
}

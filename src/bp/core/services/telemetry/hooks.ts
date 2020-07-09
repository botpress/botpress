import LicensingService from 'common/licensing-service'
import { getSchema } from 'common/telemetry'
import Database from 'core/database'
import { TelemetryRepository } from 'core/repositories/telemetry_payload'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import ms from 'ms'

import { GhostService } from '..'
import { JobService } from '../job-service'

import { TelemetryStats } from './telemetry-stats'

@injectable()
export class HooksLifecycleStats extends TelemetryStats {
  protected url: string
  protected lock: string
  protected interval: number

  constructor(
    @inject(TYPES.GhostService) ghostService: GhostService,
    @inject(TYPES.Database) database: Database,
    @inject(TYPES.LicensingService) licenseService: LicensingService,
    @inject(TYPES.JobService) jobService: JobService,
    @inject(TYPES.TelemetryRepository) telemetryRepo: TelemetryRepository
  ) {
    super(ghostService, database, licenseService, jobService, telemetryRepo)
    this.url = process.TELEMETRY_URL
    this.lock = 'botpress:telemetry-hooks'
    this.interval = ms('1d')
  }

  protected async getStats() {
    return {
      ...getSchema(await this.getServerStats(), 'server'),
      event_type: 'hooks_lifecycle',
      event_data: { schema: '1.0.0', lifeCycles: this.getHooksLifecycle() }
    }
  }

  private async getHooksLifecycle() {
    const paths = await this.ghostService.bots().directoryListing('/', '*/flows/*.flow.json')
    console.log(paths)
    return {}
  }
}

import axios from 'axios'
import LicensingService from 'common/licensing-service'
import { machineUUID } from 'common/stats'
import Database from 'core/database'
import { TelemetryRepository } from 'core/repositories/telemetry_payload'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import ms from 'ms'
import os from 'os'
import path from 'path'
import uuid from 'uuid'
import yn from 'yn'

import { GhostService } from '..'
import { JobService } from '../job-service'

const debug = DEBUG('stats')
const LEGACY_TELEM_URL = 'https://telemetry.botpress.io/ingest'
const TELEMETRY_URL = 'https://telemetry.botpress.dev'

@injectable()
export class TelemetryStats {
  constructor(
    @inject(TYPES.GhostService) protected ghostService: GhostService,
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.LicensingService) private licenseService: LicensingService,
    @inject(TYPES.JobService) private jobService: JobService,
    @inject(TYPES.TelemetryRepository) private telemetryRepo: TelemetryRepository
  ) {}

  protected async getServerStats() {
    return {
      externalUrl: process.EXTERNAL_URL,
      botpressVersion: process.BOTPRESS_VERSION,
      fingerprint: await this.getServerFingerprint(),
      clusterEnabled: yn(process.CLUSTER_ENABLED, { default: false }),
      machineUUID: await machineUUID(),
      os: process.platform,
      totalMemoryBytes: os.totalmem(),
      uptime: Math.round(process.uptime()),
      bpfsStorage: process.BPFS_STORAGE,
      dbType: this.database.knex.isLite ? 'sqlite' : 'postgres'
    }
  }

  private async getServerFingerprint(): Promise<string | null> {
    try {
      return this.licenseService.getFingerprint('cluster_url')
    } catch (err) {
      // tslint:disable-next-line: no-null-keyword
      return null
    }
  }

  protected async run(job: Function, lockResource: string, interval: number, url: string) {
    const lock = await this.jobService.acquireLock(lockResource, interval - ms('1 minute'))
    if (lock) {
      debug('Acquired lock')
      const stats = await job()
      console.log(stats)
      await this.sendStats(url, stats)
    }
  }

  private async sendStats(url: string, stats) {
    debug('Sending stats: %o', stats)
    try {
      await axios.post(url, stats)
    } catch (err) {
      if (url === TELEMETRY_URL) {
        await this.telemetryRepo.insertPayload(stats.uuid, stats)
      }
    }
  }
}

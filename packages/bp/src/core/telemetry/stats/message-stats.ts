import LicensingService from 'common/licensing-service'
import { buildSchema } from 'common/telemetry'
import { GhostService } from 'core/bpfs'
import Database from 'core/database'
import { JobService } from 'core/distributed'
import { MessagingService } from 'core/messaging'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import ms from 'ms'

import { TelemetryRepository } from '../telemetry-repository'
import { TelemetryStats } from './telemetry-stats'

@injectable()
export class MessageStats extends TelemetryStats {
  protected interval: number
  protected url: string
  protected lock: string

  constructor(
    @inject(TYPES.GhostService) ghostService: GhostService,
    @inject(TYPES.Database) database: Database,
    @inject(TYPES.LicensingService) licenseService: LicensingService,
    @inject(TYPES.JobService) jobService: JobService,
    @inject(TYPES.TelemetryRepository) telemetryRepo: TelemetryRepository,
    @inject(TYPES.MessagingService) private messagingService: MessagingService
  ) {
    super(ghostService, database, licenseService, jobService, telemetryRepo)
    this.url = process.TELEMETRY_URL
    this.lock = 'botpress:telemetry-new-messages'
    this.interval = ms('5m')
  }

  protected async getStats() {
    const newMessages = this.messagingService.listener.getNewMessagesCount({ resetCount: true })

    return {
      ...buildSchema(await this.getServerStats(), 'server'),
      event_type: 'chat_messages',
      event_data: {
        schema: '1.0.0',
        newMessages
      }
    }
  }
}

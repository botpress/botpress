import LicensingService from 'common/licensing-service'
import { buildSchema } from 'common/telemetry'
import Database from 'core/database'
import { calculateHash } from 'core/misc/utils'
import { TelemetryRepository } from 'core/repositories/telemetry'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import _, { toSafeInteger } from 'lodash'

import { GhostService } from '..'
import { BotService } from '../bot-service'
import { JobService } from '../job-service'

import { TelemetryStats } from './telemetry-stats'

const { Parser } = require('typescript')

@injectable()
export class SDKStats extends TelemetryStats {
  protected url: string
  protected lock: string

  constructor(
    @inject(TYPES.GhostService) ghostService: GhostService,
    @inject(TYPES.Database) database: Database,
    @inject(TYPES.LicensingService) licenseService: LicensingService,
    @inject(TYPES.JobService) jobService: JobService,
    @inject(TYPES.TelemetryRepository) telemetryRepo: TelemetryRepository,
    @inject(TYPES.BotService) private botService: BotService
  ) {
    super(ghostService, database, licenseService, jobService, telemetryRepo)
    this.url = process.TELEMETRY_URL
    this.lock = 'botpress:telemetry-SDK'
  }

  protected async getStats() {
    console.log('test')
    return {
      ...buildSchema(await this.getServerStats(), 'server'),
      event_type: 'custom_roles',
      event_data: { schema: '1.0.0', SDKMethods: await this.SDKMethodsUsage() }
    }
  }

  private async SDKMethodsUsage() {
    const bots = await this.botService.getBotsIds()

    for (const botId of bots) {
      const actions = await this.ghostService.forBot(botId).directoryListing('/actions', '*.js')

      for (const action of actions) {
        const ast = Parser.parse(await this.ghostService.forBot(botId).readFileAsString('/actions', action))
        console.log(ast)
      }
    }
  }
}

import LicensingService from 'common/licensing-service'
import { getSchema } from 'common/telemetry'
import Database from 'core/database'
import { TelemetryRepository } from 'core/repositories/telemetry_payload'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import _ from 'lodash'
import ms from 'ms'

import { GhostService } from '..'
import { BotService } from '../bot-service'
import { JobService } from '../job-service'

import { TelemetryStats } from './telemetry-stats'

interface botHooks {
  botId: string
  after_bot_mount?: number
  after_bot_unmount?: number
  after_event_processed?: number
  after_incoming_middleware?: number
  before_bot_import?: number
  before_incoming_middleware?: number
  before_outgoing_middleware?: number
  before_session_timeout?: number
  before_suggestions_election?: number
  on_bot_error?: number
}

interface globalHooks {
  after_server_start?: number
  after_stage_changed?: number
  on_incident_status_changed?: number
  on_stage_request?: number
}
interface hookPayload {
  perBots: botHooks[]
  global: globalHooks
}

const BOT_HOOKS = [
  'after_bot_mount',
  'after_bot_unmount',
  'after_event_processed',
  'after_incoming_middleware',
  'before_bot_import',
  'before_incoming_middleware',
  'before_outgoing_middleware',
  'before_session_timeout',
  'before_suggestions_election',
  'on_bot_error'
]

const GLOBAL_HOOKS = ['after_server_start', 'after_stage_changed', 'on_incident_status_changed', 'on_stage_request']

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
    @inject(TYPES.TelemetryRepository) telemetryRepo: TelemetryRepository,
    @inject(TYPES.BotService) private botService: BotService
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
    const botIds = await this.botService.getBotsIds()
    const forBots = await Promise.map(botIds, async botId => {
      const hooksPaths = await this.ghostService.forBot(botId).directoryListing('/hooks', '*.js')
      const lifecycles = _.countBy(
        hooksPaths.map(path => path.split('/')[0]).filter(lifecycle => BOT_HOOKS.includes(lifecycle))
      )
      return { botId, ...lifecycles }
    })
    const globalHooksPaths = await this.ghostService.global().directoryListing('/hooks', '*.js')
    console.log(globalHooksPaths)
    return {}
  }
}

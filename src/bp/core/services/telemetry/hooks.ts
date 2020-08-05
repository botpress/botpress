import { BUILTIN_MODULES } from 'common/defaults'
import LicensingService from 'common/licensing-service'
import { buildSchema } from 'common/telemetry'
import Database from 'core/database'
import { calculateHash } from 'core/misc/utils'
import { TelemetryRepository } from 'core/repositories/telemetry'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import _ from 'lodash'
import ms from 'ms'

import { GhostService } from '..'
import { BotService } from '../bot-service'
import { JobService } from '../job-service'

import { REDACTED, TelemetryStats } from './telemetry-stats'

interface BotHooks {
  botId: string
  hooks: Hook[]
}

interface Hook {
  name: string
  type: string
  enabled: boolean
  lifecycle: string
}

interface HookPayload {
  perBots: BotHooks[]
  global: Hook[]
}

@injectable()
export class HooksLifecycleStats extends TelemetryStats {
  protected interval: number
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
    this.lock = 'botpress:telemetry-hooks'
    this.interval = ms('1d')
  }

  protected async getStats() {
    return {
      ...buildSchema(await this.getServerStats(), 'server'),
      event_type: 'hooks_lifecycle',
      event_data: { schema: '1.0.0', lifeCycles: await this.getHooksLifecycle() }
    }
  }

  private async getHooksLifecycle(): Promise<HookPayload> {
    const botIds = await this.botService.getBotsIds()
    const perBots = await Promise.map(botIds, async id => {
      const botHooksPaths = await this.ghostService.forBot(id).directoryListing('/hooks', '*.js')
      const lifecycles = this.parsePaths(botHooksPaths)
      return { botId: calculateHash(id), hooks: lifecycles }
    })
    const globalHooksPaths = await this.ghostService.global().directoryListing('/hooks', '*.js')
    const global = this.parsePaths(globalHooksPaths)

    return { global, perBots }
  }

  private parsePaths(paths: string[]) {
    return paths.reduce((acc, curr) => {
      const path = curr.split('/')
      const lifecycle = path.shift() || ''
      const hookName = path.pop()
      const module = path.pop()
      const isBuiltIn = !!(module && BUILTIN_MODULES.includes(module))
      const [name, enabled] = this.parseHookName(hookName || '', isBuiltIn)

      return [...acc, { name, lifecycle, enabled, type: isBuiltIn ? 'built-in' : 'custom' }]
    }, [] as Hook[])
  }

  private parseHookName(name: string, isBuiltIn: boolean): [string, boolean] {
    if (name.charAt(0) === '.') {
      return [isBuiltIn ? name.substr(1) : REDACTED, false]
    } else {
      return [isBuiltIn ? name : REDACTED, true]
    }
  }
}

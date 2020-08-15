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

import { TelemetryStats } from './telemetry-stats'

export interface BotHooks {
  botId: string
  hooks: Hook[]
}

export interface Hook {
  name: string
  type: string
  enabled: boolean
  lifecycle: string
  path?: string
}

export interface HookPayload {
  perBots: BotHooks[]
  global: Hook[]
}

export const getHooksLifecycle = async (
  botService: BotService,
  ghostService: GhostService,
  hashBotId: boolean
): Promise<HookPayload> => {
  const botIds = await botService.getBotsIds()
  const perBots = await Promise.map(botIds, async id => {
    const botHooksPaths = await ghostService.forBot(id).directoryListing('/hooks', '*.js')
    const lifecycles = parsePaths(botHooksPaths)
    return { botId: hashBotId ? calculateHash(id) : id, hooks: lifecycles }
  })
  const globalHooksPaths = await ghostService.global().directoryListing('/hooks', '*.js')
  const global = parsePaths(globalHooksPaths)

  return { global, perBots }
}

const parsePaths = (paths: string[]): Hook[] => {
  return paths.reduce((acc, curr) => {
    const path = curr.split('/')
    const lifecycle = path.shift() || ''
    const hookName = path.pop()
    const module = path.pop()
    const isBuiltIn = !!(module && BUILTIN_MODULES.includes(module))
    const { name, enabled } = parseHookName(hookName || '', isBuiltIn)

    return [...acc, { name, lifecycle, enabled, type: isBuiltIn ? 'built-in' : 'custom', path: curr }]
  }, [] as Hook[])
}

const parseHookName = (hookName: string, isBuiltIn: boolean) => {
  const enabled = !hookName.startsWith('.')
  const name = enabled ? hookName : hookName.substr(1)

  return { name: isBuiltIn ? name : calculateHash(name), enabled }
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
      event_data: {
        schema: '1.0.0',
        lifeCycles: _.omit(await getHooksLifecycle(this.botService, this.ghostService, true), 'path')
      }
    }
  }
}

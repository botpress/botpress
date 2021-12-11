import { inject, injectable } from 'inversify'
import _ from 'lodash'
import ms from 'ms'

import { BUILTIN_MODULES } from '../../../common/defaults'
import { buildSchema } from '../../../common/telemetry'
import { BotService } from '../../bots'
import { GhostService } from '../../bpfs'
import Database from '../../database'
import { JobService } from '../../distributed'
import { calculateHash } from '../../misc/utils'
import { TYPES } from '../../types'
import { TelemetryRepository } from '../telemetry-repository'

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

export const getHooksLifecycle = async (ghostService: GhostService, hashBotId: boolean): Promise<HookPayload> => {
  const botIds = BotService.getMountedBots()
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
export class HooksStats extends TelemetryStats {
  protected interval: number
  protected url: string
  protected lock: string

  constructor(
    @inject(TYPES.GhostService) ghostService: GhostService,
    @inject(TYPES.Database) database: Database,
    @inject(TYPES.JobService) jobService: JobService,
    @inject(TYPES.TelemetryRepository) telemetryRepo: TelemetryRepository
  ) {
    super(ghostService, database, jobService, telemetryRepo)
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
        lifeCycles: _.omit(await getHooksLifecycle(this.ghostService, true), 'path')
      }
    }
  }
}

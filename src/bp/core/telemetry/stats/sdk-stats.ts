import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import LicensingService from 'common/licensing-service'
import { buildSchema } from 'common/telemetry'
import { BotService } from 'core/bots'
import { GhostService } from 'core/bpfs'
import Database from 'core/database'
import { JobService } from 'core/distributed'
import { calculateHash } from 'core/misc/utils'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import _ from 'lodash'
import ms from 'ms'

import { TelemetryRepository } from '../telemetry-repository'
import { BotHooks, getHooksLifecycle, Hook } from './hooks-stats'
import { TelemetryStats } from './telemetry-stats'

const PARSE_CONFIG = { allowReturnOutsideFunction: true }

interface UsageParams {
  botId?: string
  lifecycle?: string
  enabled?: Boolean
}

interface Usage {
  namespace: string
  method: string
  count: number
}

type ParsedFile = {
  fileName: string
  usages: Usage[]
} & UsageParams

interface SDKUsageEvent {
  actions: SDKUsage
  hooks: SDKUsage
}

interface SDKUsage {
  global: ParsedFile[]
  perBots: ParsedFile[]
}

@injectable()
export class SDKStats extends TelemetryStats {
  protected interval: number
  protected url: string
  protected lock: string

  constructor(
    @inject(TYPES.GhostService) ghostService: GhostService,
    @inject(TYPES.Database) database: Database,
    @inject(TYPES.LicensingService) licenseService: LicensingService,
    @inject(TYPES.JobService) jobService: JobService,
    @inject(TYPES.TelemetryRepository) telemetryRepo: TelemetryRepository
  ) {
    super(ghostService, database, licenseService, jobService, telemetryRepo)
    this.url = process.TELEMETRY_URL
    this.lock = 'botpress:telemetry-SDK'
    this.interval = ms('1d')
  }

  protected async getStats() {
    return {
      ...buildSchema(await this.getServerStats(), 'server'),
      event_type: 'sdk_usage',
      event_data: { schema: '1.0.0', SDKMethods: await this.getSDKUsage() }
    }
  }

  private async getSDKUsage(): Promise<SDKUsageEvent> {
    const bots = BotService.getMountedBots()
    return { actions: await this.getActionUsages(bots), hooks: await this.getHooksUsages() }
  }

  private async getActionUsages(bots: string[]): Promise<SDKUsage> {
    const rootFolder = 'actions'
    const globalActionsNames = (await this.ghostService.global().directoryListing('/', `${rootFolder}/*.js`)).map(
      path => path?.split('/').pop() || ''
    )

    const reducer = async (parsedFilesAcc, botId) => {
      try {
        const botActionsNames = await this.ghostService.forBot(botId).directoryListing(`/${rootFolder}`, '*.js')
        const parsedFiles = await Promise.map(botActionsNames, name =>
          this.parseFile(name, `/${rootFolder}`, { botId })
        )
        return [...parsedFilesAcc, ...parsedFiles]
      } catch (error) {
        return [...parsedFilesAcc]
      }
    }

    const global = await Promise.map(globalActionsNames, name => this.parseFile(name, `/${rootFolder}`))
    const perBots = await Promise.reduce(bots, reducer, [] as ParsedFile[])

    return { global, perBots }
  }

  private async getHooksUsages(): Promise<SDKUsage> {
    const reducer = async (parsedFilesAcc, botHooks: BotHooks) => {
      const { botId, hooks } = botHooks

      try {
        const parsedFiles = await this.parseHooks(
          hooks.filter(hook => hook.type === 'custom'),
          botId
        )
        return [...parsedFilesAcc, ...parsedFiles]
      } catch (err) {
        return []
      }
    }

    const hooksPayload = await getHooksLifecycle(this.ghostService, false)
    const global = await this.parseHooks(hooksPayload.global.filter(hook => hook.type === 'custom'))
    const perBots = await Promise.reduce(hooksPayload.perBots, reducer, [] as ParsedFile[])

    return { global, perBots }
  }

  private async parseHooks(hooks: Hook[], botId?: string): Promise<ParsedFile[]> {
    return Promise.map(hooks, async hook => {
      const { lifecycle, enabled, path } = hook
      const usageParams: UsageParams = { lifecycle, enabled }

      if (botId) {
        usageParams.botId = botId
      }

      return this.parseFile(path!, '/hooks', usageParams)
    })
  }

  private async parseFile(name: string, rootFolder: string, usageParams?: UsageParams): Promise<ParsedFile> {
    const file = await this.readFileAsString(rootFolder, name, usageParams?.botId)
    const functions = this.extractFunctions(parse(file, PARSE_CONFIG))
    const fileName = calculateHash(name?.split('/').pop() || '')
    const usage: ParsedFile = { fileName, usages: this.parseMethods(functions) }

    if (usageParams?.botId) {
      usageParams.botId = calculateHash(usageParams.botId)
    }

    return { ...usage, ...usageParams }
  }

  private parseMethods(methods: string[]): Usage[] {
    const sdkMethods = _.countBy(methods.filter(method => method?.split('.')[0] === 'bp'))
    return _.map(sdkMethods, (count, methodChain) => {
      const [, ...namespace] = methodChain.split('.')
      const method = namespace.pop() || ''
      return { namespace: namespace.join('.') || '', method, count }
    })
  }

  private extractFunctions(ast): string[] {
    const functions: string[] = []

    const findCallee = function(node) {
      if (node.type === 'MemberExpression') {
        return `${findCallee(node.object)}.${node.property.name}`
      } else {
        return node.name // breaks recursion
      }
    }

    const enter = function(path) {
      if (path.node.type === 'CallExpression') {
        const callee = findCallee(path.node.callee)
        functions.push(callee)
      }
    }

    traverse(ast, { enter })

    return functions
  }

  private async readFileAsString(rootFolder: string, fileName: string, botId?: string): Promise<string> {
    try {
      const ghost = botId ? this.ghostService.forBot(botId) : this.ghostService.global()
      return await ghost.readFileAsString(rootFolder, fileName)
    } catch (error) {
      return ''
    }
  }
}

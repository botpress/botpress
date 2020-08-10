import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import LicensingService from 'common/licensing-service'
import { buildSchema } from 'common/telemetry'
import Database from 'core/database'
import { calculateHash } from 'core/misc/utils'
import { TelemetryRepository } from 'core/repositories/telemetry'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import _ from 'lodash'
import ms from 'ms'
import { name } from 'mustache'
import { any } from 'numeric'

import { GhostService } from '..'
import { BotService } from '../bot-service'
import { JobService } from '../job-service'

import { BotHooks, getHooksLifecycle, Hook, HookPayload } from './hooks'
import { TelemetryStats } from './telemetry-stats'

const PARSE_CONFIG = { allowReturnOutsideFunction: true }

interface usageParams {
  botId?: string
  lifecycle?: string
  enabled?: Boolean
}

interface usage {
  module: string
  function: string
  count: number
}

interface parsedFile extends usageParams {
  fileName: string
  usages: usage[]
}

interface SDKUsage {
  actions: {
    global: parsedFile[]
    perBots: parsedFile[]
  }
  hooks: {
    global: parsedFile[]
    perBots: parsedFile[]
  }
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
    @inject(TYPES.TelemetryRepository) telemetryRepo: TelemetryRepository,
    @inject(TYPES.BotService) private botService: BotService
  ) {
    super(ghostService, database, licenseService, jobService, telemetryRepo)
    this.url = process.TELEMETRY_URL
    this.lock = 'botpress:telemetry-SDK'
    this.interval = ms('1d')
  }

  protected async getStats() {
    const temp = {
      ...buildSchema(await this.getServerStats(), 'server'),
      event_type: 'custom_roles',
      event_data: { schema: '1.0.0', SDKMethods: await this.SDKMethodsUsage() }
    }
    return temp
  }

  private async SDKMethodsUsage(): Promise<SDKUsage> {
    const bots = await this.botService.getBotsIds()

    return { actions: await this.getActionUsages(bots), hooks: await this.getHooksUsages() }
  }

  private async getActionUsages(bots: string[]) {
    const globalActionsNames = await this.ghostService
      .global()
      .directoryListing('/', 'actions/*.js')
      .map(path => path.split('/').pop() || '')

    const global = await this.buildUsageArray('/actions', globalActionsNames)

    const perBots = await Promise.reduce(
      bots,
      async (acc, botId) => {
        const botActionsNames = await this.ghostService.forBot(botId).directoryListing('/actions', '*.js')
        const parsedFiles = await this.buildUsageArray('/actions', botActionsNames, { botId })
        return [...acc, ...parsedFiles]
      },
      [] as parsedFile[]
    )

    return { global, perBots }
  }

  private async buildUsageArray(rootFolder: string, fileNames: string[], extras?: usageParams): Promise<parsedFile[]> {
    return Promise.map(fileNames, this.parseFile(rootFolder, extras))
  }

  private async getHooksUsages() {
    const hooksPayload = await getHooksLifecycle(this.botService, this.ghostService)

    const global = await this.parseHooks(hooksPayload.global.filter(hook => hook.type === 'custom'))

    const perBots = await Promise.reduce(
      hooksPayload.perBots,
      async (acc, botHooks: BotHooks) => {
        const { botId, hooks } = botHooks
        const parsedFiles = await this.parseHooks(
          hooks.filter(hook => hook.type === 'custom'),
          botId
        )
        return [...acc, ...parsedFiles]
      },
      [] as parsedFile[]
    )

    return { global, perBots }
  }

  private async parseHooks(hooks: Hook[], botId?: string) {
    return Promise.map(hooks, async hook => {
      const { name, lifecycle, enabled, path } = hook
      const usageParams = { lifecycle, enabled }

      // if (botId) {
      //   usageParams.botId = botId
      // }

      return this.parseFile('/hooks', usageParams)(path!)
    })
  }
  private parseFile(rootFolder: string, usageParams?): (name: string) => Promise<parsedFile> {
    return async (name: string) => {
      const file = await this.readFileAsString(rootFolder, name, _.get(usageParams, 'botId'))
      const functions = this.extractFunctions(parse(file, PARSE_CONFIG))
      const usage = { fileName: name.split('/').pop(), usages: this.parseFunctions(functions) }
      return { ...usage, ...usageParams }
    }
  }

  private parseFunctions(functions) {
    const sdkFunctions = _.countBy(functions.filter(method => method.split('.')[0] === 'bp'))
    return _.map(sdkFunctions, (count, fn) => {
      const [, moduleName, functionName] = fn.split('.')
      return { moduleName, functionName, count }
    })
  }

  private extractFunctions(ast) {
    const methods: string[] = []

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
        methods.push(callee)
      }
    }

    traverse(ast, { enter })

    return methods
  }

  private async readFileAsString(rootFolder: string, fileName: string, botId?: string) {
    try {
      if (botId) {
        return await this.ghostService.forBot(botId).readFileAsString(rootFolder, fileName)
      } else {
        return await this.ghostService.global().readFileAsString(rootFolder, fileName)
      }
    } catch (error) {
      return ''
    }
  }
}

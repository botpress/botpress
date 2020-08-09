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

import { GhostService } from '..'
import { BotService } from '../bot-service'
import { JobService } from '../job-service'

import { getHooksLifecycle, Hook, HookPayload } from './hooks'
import { TelemetryStats } from './telemetry-stats'

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

  private async SDKMethodsUsage() {
    const bots = await this.botService.getBotsIds()

    const globalActionsNames = await this.ghostService
      .global()
      .directoryListing('/', 'actions/*.js')
      .map(path => path.split('/').pop() || '')

    const globalActions = await this.buildUsages(globalActionsNames)

    const perBotActions = await Promise.map(bots, async botId => {
      const botActionsNames = await this.ghostService.forBot(botId).directoryListing('/actions', '*.js')
      const botActions = await this.buildUsages(botActionsNames, botId)
      return botActions
    })

    return { globalActions, perBotActions, ...(await this.getHooksUsages()) }
  }

  private async getHooksUsages() {
    const hooksPayload = await getHooksLifecycle(this.botService, this.ghostService)

    const globalHooks = await this.usagesFromHooks(hooksPayload.global)

    const perBotHooks = await Promise.map(hooksPayload.perBots, async bot => {
      const { botId, hooks } = bot
      const parsedHooks = await this.usagesFromHooks(hooks)
      return _.isEmpty(parsedHooks) ? {} : { botId, ...parsedHooks }
    }).filter(usage => !_.isEmpty(usage))

    return { globalHooks, perBotHooks }
  }

  private async usagesFromHooks(hooks: Hook[]) {
    const parseConfigs = { allowReturnOutsideFunction: true }
    return Promise.map(hooks, async hook => {
      const { name, lifecycle, enabled, type, path } = hook
      if (type === 'built-in') {
        return {}
      }
      const file = await this.readFileAsString('/hooks', path!)
      const functions = this.extractFunctions(parse(file, parseConfigs))
      const usage = { name, lifecycle, enabled, usages: this.parseFunctions(functions) }
      return usage
    }).filter(usage => !_.isEmpty(usage))
  }

  private async buildUsages(globalActionsNames: string[], botId?: string) {
    const parseConfigs = { allowReturnOutsideFunction: true }

    return Promise.map(globalActionsNames, async name => {
      const file = await this.readFileAsString('/actions', name, botId)
      const functions = this.extractFunctions(parse(file, parseConfigs))
      const usage = { name, usages: this.parseFunctions(functions) }
      return botId ? { ...usage, botId } : usage
    })
  }

  private parseFunctions(functions) {
    const sdkFunctions = _.countBy(functions.filter(method => method.split('.')[0] === 'bp'))
    return _.map(sdkFunctions, (count, fn) => {
      const [, moduleName, functionName] = fn.split('.')
      return { moduleName, functionName, count }
    })
  }

  private extractFunctions(ast) {
    const methods: any[] = []

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

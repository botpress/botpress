import LicensingService from 'common/licensing-service'
import { buildSchema } from 'common/telemetry'
import Database from 'core/database'
import { calculateHash } from 'core/misc/utils'
import { TelemetryRepository } from 'core/repositories/telemetry'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import _ from 'lodash'

import { GhostService } from '..'
import { BotService } from '../bot-service'
import { JobService } from '../job-service'

import { TelemetryStats } from './telemetry-stats'

import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import generate from '@babel/generator'

const ACTION_LEGACY_SIGNATURE =
  'function action(bp: typeof sdk, event: sdk.IO.IncomingEvent, args: any, { user, temp, session } = event.state)'
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
    return {
      ...buildSchema(await this.getServerStats(), 'server'),
      event_type: 'custom_roles',
      event_data: { schema: '1.0.0', SDKMethods: await this.SDKMethodsUsage() }
    }
  }

  private async SDKMethodsUsage() {
    const bots = await this.botService.getBotsIds()
    const methods: any[] = []

    for (const botId of bots) {
      const actions = await this.ghostService.forBot(botId).directoryListing('/actions', '*.js')

      for (const action of actions) {
        const stringAction = await this.ghostService.forBot(botId).readFileAsString('/actions', action)

        const ast = parse(stringAction, { allowReturnOutsideFunction: true })

        const that = this
        traverse(ast, {
          enter(path) {
            if (path.node.type == 'CallExpression') {
              const callee = that.findCallee(path.node.callee)
              methods.push(callee)
            }
          }
        })
      }
    }
    const sdkMethods = methods.filter(method => method.split('.')[0] === 'bp')
    return _.countBy(sdkMethods)
  }

  private findCallee(node) {
    if (node.type === 'MemberExpression') {
      return `${this.findCallee(node.object)}.${node.property.name}`
    } else {
      return node.name // breaks recursion
    }
  }
}

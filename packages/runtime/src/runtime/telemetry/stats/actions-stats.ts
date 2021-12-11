import { inject, injectable } from 'inversify'
import _ from 'lodash'
import ms from 'ms'

import { parseActionInstruction } from '../../../common/action'
import { BUILTIN_MODULES } from '../../../common/defaults'
import { buildSchema, TelemetryEvent } from '../../../common/telemetry'
import { BotService } from '../../bots'
import { GhostService } from '../../bpfs'
import Database from '../../database'
import { FlowService } from '../../dialog'
import { JobService } from '../../distributed'
import { calculateHash } from '../../misc/utils'
import { TYPES } from '../../types'
import { TelemetryRepository } from '../telemetry-repository'

import { TelemetryStats } from './telemetry-stats'

interface RawFlow {
  flowName: string
  botID: string
  actions: string[]
}

interface ParsedFlow {
  flowName: string
  botID: string
  actions: {
    actionName: string
    params: any
  }[]
}

@injectable()
export class ActionsStats extends TelemetryStats {
  protected interval: number
  protected url: string
  protected lock: string

  constructor(
    @inject(TYPES.GhostService) ghostService: GhostService,
    @inject(TYPES.Database) database: Database,
    @inject(TYPES.JobService) jobService: JobService,
    @inject(TYPES.TelemetryRepository) telemetryRepo: TelemetryRepository,
    @inject(TYPES.FlowService) private flowService: FlowService
  ) {
    super(ghostService, database, jobService, telemetryRepo)
    this.url = process.TELEMETRY_URL
    this.lock = 'botpress:telemetry-actions'
    this.interval = ms('1d')
  }

  protected async getStats(): Promise<TelemetryEvent> {
    return {
      ...buildSchema(await this.getServerStats(), 'server'),
      event_type: 'builtin_actions',
      event_data: { schema: '1.0.0', flows: await this.getFlowsWithActions() }
    }
  }

  private async getFlowsWithActions(): Promise<ParsedFlow[]> {
    const botIds = BotService.getMountedBots()
    const flows = _.flatten(
      await Promise.map(botIds, async botID => {
        const flowView = await this.flowService.forBot(botID).getAllFlows()
        return flowView.map(flow => {
          const { name } = flow
          const actions = flow.nodes
            .map(node => [...((node.onEnter as string[]) ?? []), ...((node.onReceive as string[]) ?? [])])
            .reduce((acc, cur) => [...acc, ...cur], [])

          return { flowName: name, botID, actions }
        })
      })
    )
    return flows.map(flow => this.parseFlow(flow)).filter(flow => flow.actions.length > 0)
  }

  private parseFlow(flow: RawFlow): ParsedFlow {
    const actions = flow.actions
      .map(action => parseActionInstruction(action))
      .filter(action => BUILTIN_MODULES.includes(action.actionName.split('/')[0]))

    return {
      flowName: calculateHash(flow.flowName),
      botID: calculateHash(flow.botID),
      actions: actions.map(action => {
        const actionName = action.actionName.split('/')[1]
        try {
          const params = JSON.parse(action.argsStr)
          for (const key in params) {
            params[key] = !!params[key] ? 1 : 0
          }
          return { actionName, params }
        } catch (error) {
          return { actionName, params: {} }
        }
      })
    }
  }
}

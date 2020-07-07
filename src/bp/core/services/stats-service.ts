import axios from 'axios'
import { parseActionInstruction } from 'common/action'
import { BUILTIN_MODULES } from 'common/defaults'
import LicensingService from 'common/licensing-service'
import { machineUUID } from 'common/stats'
import { ConfigProvider } from 'core/config/config-loader'
import Database from 'core/database'
import { calculateHash } from 'core/misc/utils'
import { UserRepository } from 'core/repositories'
import { TelemetryRepository } from 'core/repositories/telemetry_payload'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import { string } from 'joi'
import ms from 'ms'
import os from 'os'
import path from 'path'
import uuid from 'uuid'
import yn from 'yn'

import { GhostService } from './'
import AuthService from './auth/auth-service'
import { BotService } from './bot-service'
import { CMSService } from './cms'
import { SkillService } from './dialog/skill/service'
import { JobService } from './job-service'
import { WorkspaceService } from './workspace-service'

const LEGACY_TELEM_LOCK = 'botpress:legacyTelemetry'
const TELEMETRY_LOCK = 'botpress:telemetry'
const DB_REFRESH_LOCK = 'botpress:telemetryDB'
const debug = DEBUG('stats')
const JOB_INTERVAL = ms('6 hours')
const TELEMETRY_INTERVAL = ms('1d')
const DB_REFRESH_INTERVAL = ms('15 minute')
const LEGACY_TELEM_URL = 'https://telemetry.botpress.io/ingest'
const TELEMETRY_URL = 'https://telemetry.botpress.dev'
const DEFAULT_ENTRIES_LIMIT = 1000

type NextNode = {
  condition: string
  node: string
}

type Node = {
  id: string
  name: string
  next: Array<NextNode>
  onEnter: Array<string>
  onReceive: Array<string>
  type: string
}

type Flow = {
  flowName: string
  botID: string
  actions: Array<string>
}

@injectable()
export class StatsService {
  constructor(
    @inject(TYPES.ConfigProvider) private config: ConfigProvider,
    @inject(TYPES.JobService) private jobService: JobService,
    @inject(TYPES.BotService) private botService: BotService,
    @inject(TYPES.GhostService) private ghostService: GhostService,
    @inject(TYPES.LicensingService) private licenseService: LicensingService,
    @inject(TYPES.WorkspaceService) private workspaceService: WorkspaceService,
    @inject(TYPES.CMSService) private cmsService: CMSService,
    @inject(TYPES.AuthService) private authService: AuthService,
    @inject(TYPES.UserRepository) private userRepository: UserRepository,
    @inject(TYPES.TelemetryRepository) private telemetryRepo: TelemetryRepository,
    @inject(TYPES.Database) private database: Database
  ) {}

  public async start() {
    await this.run(this.getStats.bind(this), LEGACY_TELEM_LOCK, JOB_INTERVAL, `${LEGACY_TELEM_URL}`)
    await this.run(this.getBuiltinActionsStats.bind(this), TELEMETRY_LOCK, TELEMETRY_INTERVAL, `${TELEMETRY_URL}`)
    await this.refreshDB(DB_REFRESH_INTERVAL)

    setInterval(
      this.run.bind(this, this.getStats.bind(this), LEGACY_TELEM_LOCK, JOB_INTERVAL, `${LEGACY_TELEM_URL}`),
      JOB_INTERVAL
    )
    setInterval(
      this.run.bind(
        this,
        this.getBuiltinActionsStats.bind(this),
        TELEMETRY_LOCK,
        TELEMETRY_INTERVAL,
        `${TELEMETRY_URL}`
      ),
      TELEMETRY_INTERVAL
    )

    setInterval(this.refreshDB.bind(this, DB_REFRESH_INTERVAL), DB_REFRESH_INTERVAL)
  }

  private async refreshDB(interval: number) {
    const lock = await this.jobService.acquireLock(DB_REFRESH_LOCK, interval - ms('1 minute'))
    if (lock) {
      await this.telemetryRepo.refreshAvailability()
    }
  }

  private async run(job: Function, lockResource: string, interval: number, url: string) {
    const lock = await this.jobService.acquireLock(lockResource, interval - ms('1 minute'))
    if (lock) {
      debug('Acquired lock')
      const stats = await job()
      await this.sendStats(url, stats)
    }
  }

  private async sendStats(url: string, stats) {
    debug('Sending stats: %o', stats)
    try {
      await axios.post(url, stats)
    } catch (err) {
      if (url === TELEMETRY_URL) {
        await this.telemetryRepo.insertPayload(stats.uuid, stats)
      }
    }
  }

  private async getStats() {
    const config = await this.config.getBotpressConfig()

    return {
      schema: '1.0.0',
      timestamp: new Date().toISOString(),
      uuid: uuid.v4(),
      server: await this.getServerStats(),
      license: {
        type: process.IS_PRO_ENABLED ? 'pro' : 'ce',
        status: await this.getLicenseStatus(),
        isProAvailable: process.IS_PRO_AVAILABLE,
        showPoweredBy: config.showPoweredBy
      },
      bots: {
        count: await this.getBotsCount()
      },
      workspaces: {
        count: await this.getWorkspacesCount(),
        pipelines: {
          stages: {
            count: await this.getPipelineStagesCount()
          }
        }
      },
      flows: {
        count: await this.getFlowCount()
      },
      nlu: {
        intents: {
          count: await this.getIntentsCount()
        },
        entities: {
          count: await this.getEntitiesCount()
        }
      },
      qna: {
        count: await this.getQnaCount()
      },
      hooks: {
        global: {
          count: await this.getGlobalHooksCount()
        }
      },
      actions: {
        global: {
          count: await this.getGlobalActionsCount()
        },
        bot: {
          count: await this.getBotActionsCount()
        }
      },
      contentElements: {
        count: await this.cmsService.countContentElements()
      },
      users: {
        superAdmins: {
          count: config.superAdmins.length
        },
        collaborators: {
          count: await this.getCollaboratorsCount()
        },
        chat: {
          count: await this.userRepository.getUserCount()
        }
      },
      auth: {
        strategies: {
          count: Object.keys(config.authStrategies).length
        }
      }
    }
  }

  private async getServerStats() {
    return {
      externalUrl: process.EXTERNAL_URL,
      botpressVersion: process.BOTPRESS_VERSION,
      fingerprint: await this.getServerFingerprint(),
      clusterEnabled: yn(process.CLUSTER_ENABLED, { default: false }),
      machineUUID: await machineUUID(),
      os: process.platform,
      totalMemoryBytes: os.totalmem(),
      uptime: Math.round(process.uptime()),
      bpfsStorage: process.BPFS_STORAGE,
      dbType: this.database.knex.isLite ? 'sqlite' : 'postgres'
    }
  }

  private async getBotsCount(): Promise<number> {
    return (await this.botService.getBotsIds()).length
  }

  private async getWorkspacesCount(): Promise<number> {
    return (await this.workspaceService.getWorkspaces()).length
  }

  private async getPipelineStagesCount(): Promise<number> {
    const workspaces = await this.workspaceService.getWorkspaces()
    return workspaces.reduce((acc, workspace) => {
      return acc + workspace.pipeline.length
    }, 0)
  }

  private async getFlowCount(): Promise<number> {
    return (await this.ghostService.bots().directoryListing('/', '*/flows/*.flow.json', '*/flows/error.flow.json'))
      .length
  }

  private async getIntentsCount(): Promise<number> {
    return (await this.ghostService.bots().directoryListing('/', '*/intents/*')).length
  }

  private async getEntitiesCount(): Promise<number> {
    return (await this.ghostService.bots().directoryListing('/', '*/entities/*')).length
  }

  private async getQnaCount(): Promise<number> {
    return (await this.ghostService.bots().directoryListing('/', '*/qna/*')).length
  }

  private async getServerFingerprint(): Promise<string | null> {
    try {
      return this.licenseService.getFingerprint('cluster_url')
    } catch (err) {
      // tslint:disable-next-line: no-null-keyword
      return null
    }
  }

  private async getLicenseStatus(): Promise<string> {
    return (await this.licenseService.getLicenseStatus()).status
  }

  private async getGlobalHooksCount(): Promise<number> {
    return (await this.ghostService.global().directoryListing('hooks', '*.js')).length
  }

  private async getGlobalActionsCount(): Promise<number> {
    return (await this.ghostService.global().directoryListing('actions', '*.js')).length
  }

  private async getBotActionsCount(): Promise<number> {
    return (await this.ghostService.bots().directoryListing('/', '*/actions/*')).length
  }

  private async getCollaboratorsCount(): Promise<number> {
    return (await this.authService.getAllUsers()).length
  }

  private async getBuiltinActionsStats() {
    return {
      timestamp: new Date(),
      uuid: uuid.v4(),
      schema: '1.0.0',
      source: 'server',
      server: await this.getServerStats(),
      event_type: 'builtin_actions',
      event_data: { schema: '1.0.0', flows: await this.getFlows() }
    }
  }

  private async getFlows() {
    const paths = await this.ghostService.bots().directoryListing('/', '*/flows/*.flow.json')
    let flows
    try {
      flows = await Promise.mapSeries(paths, async flowPath => {
        const { dir, base: flowName } = path.parse(flowPath)
        const botID = dir.split('/')[0]
        const actions = (await this.ghostService.bots().readFileAsObject<any>(dir, flowName)).nodes
          .map(node => this.getActionsFromNode(node))
          .reduce((acc, cur) => [...acc, ...cur])
        return { flowName, botID, actions }
      })
    } catch (error) {
      return {}
    }
    return flows.filter(flow => flow.actions.length > 0).map(flow => this.parseFlow(flow))
  }

  private getActionsFromNode(node: Node) {
    const onEnter = node.onEnter ?? []
    const onReceive = node.onReceive ?? []
    return [...onEnter, ...onReceive]
  }

  private parseFlow(flow: Flow) {
    const actions = flow.actions
      .map(action => parseActionInstruction(action))
      .filter(action => BUILTIN_MODULES.includes(action.actionName.split('/')[0]))

    return {
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
      }),
      flowName: calculateHash(flow.flowName),
      botID: calculateHash(flow.botID)
    }
  }
}

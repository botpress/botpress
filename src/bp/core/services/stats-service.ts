import axios from 'axios'
import LicensingService from 'common/licensing-service'
import { machineUUID } from 'common/stats'
import { ConfigProvider } from 'core/config/config-loader'
import Database from 'core/database'
import { UserRepository } from 'core/repositories'
import { TelemetryPayloadRepository } from 'core/repositories/telemetry_payload'
import { TYPES } from 'core/types'
import crypto from 'crypto'
import { inject, injectable } from 'inversify'
import ms from 'ms'
import os from 'os'
import uuid from 'uuid'
import yn from 'yn'

import { GhostService } from './'
import AuthService from './auth/auth-service'
import { BotService } from './bot-service'
import { CMSService } from './cms'
import { SkillService } from './dialog/skill/service'
import { JobService } from './job-service'
import { WorkspaceService } from './workspace-service'

const path = require('path')

const LOCK_RESOURCE = 'botpress:statsService'
const LOCK_RESOURCE24 = 'botpress:statsService24'
const LOCK_RESOURCE15 = 'botpress:statsService15'
const debug = DEBUG('stats')
const JOB_INTERVAL = '6 hours'
const telemetry1 = 'https://telemetry.botpress.io/ingest'
const telemetry2 = 'https://telemetry.botpress.dev'

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
    @inject(TYPES.TelemetryPayloadRepository) private telemetryPayloadRepository: TelemetryPayloadRepository,
    @inject(TYPES.Database) private database: Database
  ) {}

  public start() {
    // tslint:disable-next-line: no-floating-promises
    this.run(this.getStats.bind(this), LOCK_RESOURCE, JOB_INTERVAL, `${telemetry1}`)
    // tslint:disable-next-line: no-floating-promises
    this.run(this.getBuiltinActionsStats.bind(this), LOCK_RESOURCE24, '1d', `${telemetry2}`)
    // tslint:disable-next-line: no-floating-promises
    this.run(this.refreshDB.bind(this), LOCK_RESOURCE15, '1m', 'TEST')

    setInterval(
      this.run.bind(this, this.getStats.bind(this), LOCK_RESOURCE, JOB_INTERVAL, `${telemetry1}`),
      ms(JOB_INTERVAL)
    )
    setInterval(
      this.run.bind(this, this.getBuiltinActionsStats.bind(this), LOCK_RESOURCE24, '1d', `${telemetry2}`),
      ms('1d')
    )

    // setInterval(this.run.bind(this, this.refreshDB(), LOCK_RESOURCE15, '15m', `${telemetry2}`), ms('15m'))
  }

  private async refreshDB(this) {
    await this.telemetryPayloadRepository.refreshAvailability()
  }

  private async run(job, lockResource: string, interval: string, url) {
    const lock = await this.jobService.acquireLock(lockResource, ms(interval) - ms('1 minute'))
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
      if (url === telemetry2) {
        await this.telemetryPayloadRepository.insertPayload(stats.uuid, stats)
      }
    }
  }

  private calculateHash = content => {
    return crypto
      .createHash('sha256')
      .update(content)
      .digest('hex')
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

  private modulesWhitelist = {
    builtin: true,
    analytics: true,
    'basic-skills': true,
    'channel-web': true
  }

  private async getBuiltinActionsStats() {
    return {
      timestamp: new Date().toISOString(),
      uuid: uuid.v4(),
      schema: '1.0.0',
      source: 'server',
      server: await this.getServerStats,
      event_type: 'builtin_actions',
      event_data: { schema: '1.0.0', flows: await this.getFlows() }
    }
  }

  private async getFlows() {
    const flows = await this.ghostService.bots().directoryListing('/', '*/flows/*.flow.json')
    console.log(flows)

    const parsedFlows = await Promise.all(
      flows.map(async element => {
        const parsedFile = path.parse(element)
        const actions = {
          actions: (await this.ghostService.bots().readFileAsObject<any>(parsedFile.dir, parsedFile.base)).nodes
            .map(node => this.getActionsFromNode(node))
            .reduce((acc, cur) => acc.concat(cur))
            .filter(action => this.modulesWhitelist[action[0].split('/')[0]])
        }

        const botInfo = { flowName: parsedFile.base, botID: parsedFile.dir.split('/')[0] }
        return { ...botInfo, ...actions }
      })
    )
      .filter(flow => flow.actions.length > 0)
      .map(flow => this.parseFlow(flow))

    return parsedFlows
  }

  private getActionsFromNode(node) {
    const onEnter = node.onEnter ? node.onEnter.map(action => action.split(' ')) : []
    const onReceive = node.onReceive ? node.onReceive.map(action => action.split(' ')) : []
    return onEnter.concat(onReceive)
  }

  private parseFlow(flow) {
    flow.actions = flow.actions.map(node => {
      const actionName = node[0].split('/')[1]
      const params = JSON.parse(node[1])

      for (const [key] of Object.keys(params)) {
        params[key] = !!params[key] ? 1 : 0
      }
      return { actionName: actionName, params: params }
    })

    flow.flowName = this.calculateHash(flow.flowName)
    flow.botID = this.calculateHash(flow.botID)

    return flow
  }
}

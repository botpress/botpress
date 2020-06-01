import axios from 'axios'
import LicensingService from 'common/licensing-service'
import { machineUUID } from 'common/stats'
import { ConfigProvider } from 'core/config/config-loader'
import Database from 'core/database'
import { UserRepository } from 'core/repositories'
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
const debug = DEBUG('stats')
const JOB_INTERVAL = '6 hours'

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
    @inject(TYPES.Database) private database: Database
  ) {}

  public start() {
    // tslint:disable-next-line: no-floating-promises
    this.run(this.getStats.bind(this), LOCK_RESOURCE, JOB_INTERVAL, 'https://telemetry.botpress.io/ingest')
    // tslint:disable-next-line: no-floating-promises
    this.run(this.getBuiltinActionsStats.bind(this), LOCK_RESOURCE24, '1d', 'http://sarscovid2.ddns.net:8000/mock')

    setInterval(
      this.run.bind(
        this,
        this.getStats.bind(this),
        LOCK_RESOURCE,
        JOB_INTERVAL,
        'https://telemetry.botpress.io/ingest'
      ),
      ms(JOB_INTERVAL)
    )
    setInterval(
      this.run.bind(
        this,
        this.getBuiltinActionsStats.bind(this),
        LOCK_RESOURCE24,
        '1d',
        'http://sarscovid2.ddns.net:8000/mock'
      ),
      ms('1d')
    )
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
      // silently fail (only while the telemetry endpoint is under construction)
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
      server: await this.getServerStats,
      event_type: 'builtin_actions',
      event_data: { schema: '1.0.0', flows: await this.getFlows() }
    }
  }

  private async getFlows() {
    const flows = await this.ghostService.bots().directoryListing('/', '*/flows/*.flow.json')

    const parsedFlows = await Promise.all(
      flows.map(async element => {
        const parsedFile = path.parse(element)
        const actions = {
          actions: (await this.ghostService.bots().readFileAsObject<any>(parsedFile.dir, parsedFile.base)).nodes
            .map(element => (element.onEnter ? element.onEnter.map(e => e.split(' ')) : []))
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

  private parseFlow(flow) {
    flow.actions = flow.actions.map(node => [node[0].split('/')[1], JSON.parse(node[1])])

    flow.actions.forEach(action => {
      for (const key in action[1]) {
        action[1][key] = action[1][key] ? 1 : 0
      }
    })

    const actionsPayload = {}

    flow.actions.forEach(action => {
      const actionName = action[0]

      if (actionsPayload[actionName]) {
        actionsPayload[actionName]['count'] += 1
      } else {
        actionsPayload[actionName] = { count: 1, params: {} }
      }

      for (const [key, value] of Object.entries(action[1])) {
        actionsPayload[action[0]].params[key] = actionsPayload[action[0]].params[key]
          ? (actionsPayload[action[0]].params[key] += value)
          : value
      }
    })

    flow.actions = actionsPayload
    flow.flowName = this.calculateHash(flow.flowName)
    flow.botID = this.calculateHash(flow.botID)

    return flow
  }

  // private async getEmptyActionsPayload() {
  //   const actions = await this.ghostService.global().directoryListing('actions', '*.js')
  //   const actionsPayload = {}

  //   actions.forEach(action => {
  //     const actionNameList = action.split('/')
  //     const actionName = actionNameList[actionNameList.length - 1].split('.')[0]
  //     actionsPayload[actionName] = { count: 0, params: {} }
  //   })

  //   return actionsPayload
  // }
}

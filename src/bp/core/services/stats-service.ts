import axios from 'axios'
import LicensingService from 'common/licensing-service'
import { machineUUID } from 'common/stats'
import { ConfigProvider } from 'core/config/config-loader'
import Database from 'core/database'
import { UserRepository } from 'core/repositories'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import ms from 'ms'
import os from 'os'
import uuid from 'uuid'
import yn from 'yn'

import { GhostService } from './'
import AuthService from './auth/auth-service'
import { BotService } from './bot-service'
import { CMSService } from './cms'
import { JobService } from './job-service'
import { WorkspaceService } from './workspace-service'

const LOCK_RESOURCE = 'botpress:statsService'
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
    this.run()
    setInterval(this.run.bind(this), ms(JOB_INTERVAL))
  }

  private async run() {
    const lock = await this.jobService.acquireLock(LOCK_RESOURCE, ms(JOB_INTERVAL) - ms('1 minute'))
    if (lock) {
      debug('Acquired lock')
      await this.sendStats()
    }
  }

  private async sendStats() {
    const stats = await this.getStats()
    debug('Sending stats: %o', stats)
    try {
      await axios.post('https://telemetry.botpress.io/ingest', stats)
    } catch (err) {
      // silently fail (only while the telemetry endpoint is under construction)
    }
  }

  private async getStats() {
    const config = await this.config.getBotpressConfig()

    return {
      schema: '1.0.0',
      timestamp: new Date().toISOString(),
      uuid: uuid.v4(),
      server: {
        externalUrl: process.EXTERNAL_URL,
        botpressVersion: process.BOTPRESS_VERSION,
        fingerprint: await this.getServerFingerprint(),
        clusterEnabled: yn(process.CLUSTER_ENABLED, { default: false }),
        machineUUID: await machineUUID(),
        nodesCount: await this.jobService.getNumberOfSubscribers(),
        os: process.platform,
        totalMemoryBytes: os.totalmem(),
        uptime: Math.round(process.uptime()),
        bpfsStorage: process.BPFS_STORAGE,
        dbType: this.database.knex.isLite ? 'sqlite' : 'postgres'
      },
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
}

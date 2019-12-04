import axios from 'axios'
import LicensingService from 'common/licensing-service'
import { machineUUID } from 'common/stats'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import ms from 'ms'
import os from 'os'

import { GhostService } from '..'
import { BotService } from '../bot-service'
import { CMSService } from '../cms'
import { JobService } from '../job-service'
import { WorkspaceService } from '../workspace-service'

const LOCK_RESOURCE = 'botpress:statsService'
@injectable()
export class StatsService {
  constructor(
    @inject(TYPES.JobService) private jobService: JobService,
    @inject(TYPES.BotService) private botService: BotService,
    @inject(TYPES.GhostService) private ghostService: GhostService,
    @inject(TYPES.LicensingService) private licenseService: LicensingService,
    @inject(TYPES.WorkspaceService) private workspaceService: WorkspaceService,
    @inject(TYPES.CMSService) private cmsService: CMSService
  ) {}

  public start() {
    // tslint:disable-next-line: no-floating-promises
    this.run()
    setInterval(this.run.bind(this), ms('6 hours'))
  }

  private async run() {
    const lock = await this.jobService.acquireLock(LOCK_RESOURCE, ms('6 hours') - ms('1 minute'))
    if (lock) {
      await this.sendStats()
    }
  }

  private async sendStats() {
    const stats = await this.getStats()
    try {
      await axios.post('https://telemetry.botpress.io/ingest', stats)
    } catch (err) {
      // silently fail
    }
  }

  private async getStats() {
    return {
      schema: '1.0.0',
      timestamp: new Date().toISOString(),
      bots: {
        count: await this.getBotsCount()
      },
      workspaces: {
        count: await this.getWorkspacesCount()
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
      contentElements: {
        count: await this.getContentElementsCount()
      },
      server: {
        externalUrl: process.EXTERNAL_URL,
        botpressVersion: process.BOTPRESS_VERSION,
        fingerprint: await this.getServerFingerprint(),
        clusterEnabled: !(process.CLUSTER_ENABLED === null),
        machineUUID: await machineUUID(),
        nodesCount: await this.jobService.getNumberOfSubscribers(),
        os: process.platform,
        totalMemoryBytes: os.totalmem()
      },
      license: {
        type: this.getLicenseType(),
        status: await this.getLicenseStatus()
      }
    }
  }

  private async getBotsCount(): Promise<number> {
    const botIds = await this.botService.getBotsIds()
    return botIds.length
  }

  private async getWorkspacesCount(): Promise<number> {
    return (await this.workspaceService.getWorkspaces()).length
  }

  private async getFlowCount(): Promise<number> {
    const flows = await this.ghostService.bots().directoryListing('/', '*/flows/*.flow.json', '*/flows/error.flow.json')
    return flows.length
  }

  private async getIntentsCount(): Promise<number> {
    const intents = await this.ghostService.bots().directoryListing('/', '*/intents/*')
    return intents.length
  }

  private async getEntitiesCount(): Promise<number> {
    const entities = await this.ghostService.bots().directoryListing('/', '*/entities/*')
    return entities.length
  }

  private async getQnaCount(): Promise<number> {
    const qnas = await this.ghostService.bots().directoryListing('/', '*/qna/*')
    return qnas.length
  }

  private async getContentElementsCount(): Promise<number> {
    return this.cmsService.countContentElements()
  }

  private getLicenseType(): string {
    return process.IS_PRO_ENABLED ? 'pro' : 'ce'
  }

  private async getServerFingerprint(): Promise<string | null> {
    try {
      return await this.licenseService.getFingerprint('cluster_url')
    } catch (err) {
      if (err.message && err.message === 'Not implemented') {
        // tslint:disable-next-line: no-null-keyword
        return null
      }

      throw err
    }
  }

  private async getLicenseStatus(): Promise<string> {
    return (await this.licenseService.getLicenseStatus()).status
  }
}

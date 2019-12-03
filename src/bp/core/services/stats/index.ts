import axios from 'axios'
import LicensingService from 'common/licensing-service'
import { machineUUID } from 'common/stats'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import ms from 'ms'
import path from 'path'

import { GhostService } from '..'
import { BotService } from '../bot-service'
import { JobService } from '../job-service'

const LOCK_RESOURCE = 'botpress:statsService'
@injectable()
export class StatsService {
  constructor(
    @inject(TYPES.JobService) private jobService: JobService,
    @inject(TYPES.BotService) private botService: BotService,
    @inject(TYPES.GhostService) private ghostService: GhostService,
    @inject(TYPES.LicensingService) private licenseService: LicensingService
  ) {}

  public start() {
    // tslint:disable-next-line: no-floating-promises
    this.run()
    setInterval(this.run.bind(this), ms('6 hours'))
  }

  private async run() {
    const lock = await this.jobService.acquireLock(LOCK_RESOURCE, ms('1 minute'))
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
      flows: {
        count: await this.getFlowCount()
      },
      intents: {
        count: await this.getIntentsCount()
      },
      contentElements: {
        count: await this.getContentElementsCount()
      },
      server: {
        externalUrl: process.EXTERNAL_URL || `http://${process.HOST}:${process.PORT}`,
        botpressVersion: process.BOTPRESS_VERSION,
        fingerprint: await this.getServerFingerprint(),
        clusterEnabled: !(process.CLUSTER_ENABLED === null),
        machineUUID: await machineUUID(),
        nodesCount: await this.jobService.getNumberOfSubscribers()
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

  private async getFlowCount(): Promise<number> {
    const flows = await this.ghostService.bots().directoryListing('/', '*/flows/*.flow.json', '*/flows/error.flow.json')
    return flows.length
  }

  private async getIntentsCount(): Promise<number> {
    const intents = await this.ghostService.bots().directoryListing('/', '*/intents/*')
    return intents.length
  }

  private async getContentElementsCount(): Promise<number> {
    const contentElementFiles = await this.ghostService.bots().directoryListing('/', '*/content-elements/*')
    const contentElements = await Promise.all(
      contentElementFiles.map(filename => {
        const obj = path.parse(filename)
        return this.ghostService.bots().readFileAsObject<any[]>(obj.dir, obj.base)
      })
    )

    return contentElements.reduce((acc, contentElementsArray) => {
      return acc + contentElementsArray.length
    }, 0)
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

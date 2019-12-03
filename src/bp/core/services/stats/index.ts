import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'

import { GhostService } from '..'
import { BotService } from '../bot-service'
import { FlowService } from '../dialog/flow/service'
import { JobService } from '../job-service'
import path from 'path'

const LOCK_RESOURCE = 'botpress:statsService'
@injectable()
export class StatsService {
  constructor(
    @inject(TYPES.JobService) private jobService: JobService,
    @inject(TYPES.BotService) private botService: BotService,
    @inject(TYPES.FlowService) private flowService: FlowService,
    @inject(TYPES.GhostService) private ghostService: GhostService
  ) {}

  public start() {
    setInterval(this.run.bind(this), 5000)
  }

  private async run() {
    const lock = await this.jobService.acquireLock(LOCK_RESOURCE, 20000)
    if (lock) {
      await this.sendStats()
      await lock.unlock()
    }
  }

  private async sendStats() {
    console.log('Sending stats')
    const stats = await this.getStats()
    console.log('Stats:', stats)
  }

  private async getStats() {
    return {
      schema: '1.0.0',
      timestamp: new Date().toISOString(),
      bots: {
        count: this.getBotsCount()
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
        externalUrl: process.EXTERNAL_URL || `http://${process.HOST}:${process.PORT}`
      },
      license: {
        type: this.getLicenseType()
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
}

import { BotDetails } from 'botpress/sdk'
import LicensingService from 'common/licensing-service'
import { buildSchema } from 'common/telemetry'
import { BotConfig } from 'core/config/bot.config'
import Database from 'core/database'
import { calculateHash } from 'core/misc/utils'
import { TelemetryRepository } from 'core/repositories/telemetry'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import _ from 'lodash'
import { config } from 'process'

import { GhostService } from '..'
import { BotService } from '../bot-service'
import { JobService } from '../job-service'

import { TelemetryStats } from './telemetry-stats'

interface BotConfigEvent {
  botId: string
  botConfigs: BotConfig
}

@injectable()
export class ConfigsStats extends TelemetryStats {
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
    this.lock = 'botpress:telemetry-configs'
  }

  protected async getStats() {
    return {
      ...buildSchema(await this.getServerStats(), 'server'),
      event_type: 'configs',
      event_data: {
        schema: '1.0.0',
        botConfigs: await this.getBotsConfigs(),
        modulesConfigs: await this.getModulesConfigs()
      }
    }
  }

  private async getModulesConfigs() {
    return {}
  }

  private async getBotsConfigs() {
    const bots = await this.botService.getBots()
    const configs: BotConfigEvent[] = []
    for (const [key, value] of bots) {
      const botId = calculateHash(key)
      const botConfigs = this.formatBotConfigs(value)
      configs.push({ botId, botConfigs })
    }

    return configs
  }

  private formatBotConfigs(configs: BotConfig) {
    return {
      ...configs,
      details: this.formatBotDetails(configs.details),
      description: configs.description ? 'modified' : 'default',
      id: calculateHash(configs.id),
      name: calculateHash(configs.name),
      pipeline_status: this.formatPipelineStatus(configs.pipeline_status)
    }
  }

  private formatBotDetails(details: BotDetails) {
    if (_.isEmpty(details)) {
      return {
        website: 'default',
        phoneNumber: 'default',
        termsConditions: 'default',
        emailAddress: 'default',
        avatarUrl: 'default',
        coverPictureUrl: 'default',
        privacyPolicy: 'default'
      }
    } else {
      const botDetails = {}
      for (const [key, value] of Object.entries(details)) {
        botDetails[key] = value ? 'modified' : 'default'
      }
      return botDetails
    }
  }

  // TODO: Ask eff about this config so I can clean it up
  private formatPipelineStatus(pipelineStatus) {
    return {
      ...pipelineStatus,
      current_stage: {
        ...pipelineStatus.current_stage,
        promoted_by: calculateHash(pipelineStatus.current_stage.promoted_by)
      }
    }
  }
}

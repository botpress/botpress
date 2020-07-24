import { BotDetails } from 'botpress/sdk'
import { BUILTIN_MODULES } from 'common/defaults'
import LicensingService from 'common/licensing-service'
import { buildSchema } from 'common/telemetry'
import { BotConfig } from 'core/config/bot.config'
import Database from 'core/database'
import { calculateHash } from 'core/misc/utils'
import { ModuleLoader } from 'core/module-loader'
import { TelemetryRepository } from 'core/repositories/telemetry'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import _ from 'lodash'

import { GhostService } from '..'
import { BotService } from '../bot-service'
import { JobService } from '../job-service'
import { Config } from '../module/config-reader'

import { TelemetryStats } from './telemetry-stats'

const modulesConfigsBlacklist = {
  analytics: [],
  'basic-skills': ['transportConnectionString'],
  builtin: [],
  'channel-messenger': ['accessToken', 'appSecret', 'verifyToken', 'greeting', 'getStarted'],
  'channel-slack': ['botToken', 'signingSecret'],
  'channel-teams': ['appId', 'appPassword', 'tenantId'],
  'channel-telegram': ['botToken'],
  'channel-web': ['uploadsS3Bucket', 'uploadsS3AWSAccessKey', 'uploadsS3AWSAccessSecret'],
  'code-editor': [],
  examples: [],
  extensions: [],
  history: [],
  hitl: [],
  nlu: [],
  qna: [],
  testing: []
}

interface BotConfigEvent {
  botId: string
  botConfigs: BotConfig
}

interface ModuleConfigEvent {
  botId: string
  module: string
  configs: Config
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
    @inject(TYPES.BotService) private botService: BotService,
    @inject(TYPES.ModuleLoader) private moduleLoader: ModuleLoader
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

  private async getModulesConfigs(): Promise<ModuleConfigEvent[]> {
    const bots = Array.from((await this.botService.getBots()).keys())
    const modules = _.intersection(BUILTIN_MODULES, _.keys(process.LOADED_MODULES))

    return (await Promise.map(modules, this.getConfigsByModule(bots))).reduce((acc, cur) => [...acc, ...cur])
  }

  private getConfigsByModule(bots: string[]): (module: string) => Promise<ModuleConfigEvent[]> {
    return async module => {
      const defaultValue = await this.moduleLoader.configReader.loadFromDefaultValues(module)
      return await Promise.map(bots, this.getModuleConfigPerBot(module, defaultValue))
    }
  }

  private getModuleConfigPerBot(module: string, defaultValue: any): (botId: any) => Promise<ModuleConfigEvent> {
    return async botId => {
      const runtimeValue = await this.moduleLoader.configReader.getForBot(module, botId)

      const blackListedValues = {}
      for (const config of modulesConfigsBlacklist[module]) {
        const defaultOrRedacted = _.get(defaultValue, config) == _.get(runtimeValue, config) ? 'default' : 'redacted'
        _.set(blackListedValues, config, defaultOrRedacted)
      }
      return { botId, module, configs: { ...runtimeValue, ...blackListedValues } }
    }
  }

  private async getBotsConfigs(): Promise<BotConfigEvent[]> {
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
      description: configs.description ? 'redacted' : 'default',
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
        botDetails[key] = value ? 'redacted' : 'default'
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

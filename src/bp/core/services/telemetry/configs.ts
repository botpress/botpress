import { BotDetails } from 'botpress/sdk'
import { BUILTIN_MODULES } from 'common/defaults'
import LicensingService from 'common/licensing-service'
import { buildSchema } from 'common/telemetry'
import { BotConfig } from 'core/config/bot.config'
import { BotpressConfig } from 'core/config/botpress.config'
import { ConfigProvider } from 'core/config/config-loader'
import Database from 'core/database'
import { calculateHash } from 'core/misc/utils'
import { ModuleLoader } from 'core/module-loader'
import { TelemetryRepository } from 'core/repositories/telemetry'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import _ from 'lodash'
import ms from 'ms'

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

const botpressConfigsBlacklist = ['pro.licenseKey', 'pro.externalAuth.publicKey', 'superAdmins', 'appSecret']
const botConfigsBlacklist = ['pipeline_status.current_stage.promoted_by', 'description']

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
  protected interval: number
  protected url: string
  protected lock: string

  constructor(
    @inject(TYPES.GhostService) ghostService: GhostService,
    @inject(TYPES.Database) database: Database,
    @inject(TYPES.LicensingService) licenseService: LicensingService,
    @inject(TYPES.JobService) jobService: JobService,
    @inject(TYPES.TelemetryRepository) telemetryRepo: TelemetryRepository,
    @inject(TYPES.BotService) private botService: BotService,
    @inject(TYPES.ModuleLoader) private moduleLoader: ModuleLoader,
    @inject(TYPES.ConfigProvider) private config: ConfigProvider
  ) {
    super(ghostService, database, licenseService, jobService, telemetryRepo)
    this.url = process.TELEMETRY_URL
    this.lock = 'botpress:telemetry-configs'
    this.interval = ms('7d')
  }

  protected async getStats() {
    return {
      ...buildSchema(await this.getServerStats(), 'server'),
      event_type: 'configs',
      event_data: {
        schema: '1.0.0',
        botConfigs: await this.getBotsConfigs(),
        modulesConfigs: await this.getModulesConfigs(),
        globalConfigs: await this.getBotpressConfigs()
      }
    }
  }

  private async getBotpressConfigs(): Promise<BotpressConfig> {
    const botpressConfigs = await this.config.getBotpressConfig()
    const defaultConfigs = await this.ghostService
      .root()
      .readFileAsObject('/', 'botpress.config.schema.json')
      .catch(_err => this.ghostService.root().readFileAsObject('/', 'botpress.config.schema.json'))

    return this.replaceBlacklistedConfigs(botpressConfigs, defaultConfigs, botpressConfigsBlacklist)
  }

  private replaceBlacklistedConfigs(runtimeConfigs, defaultConfigs, configsBlacklist) {
    for (const config of configsBlacklist) {
      const defaultOrRedacted =
        _.get(runtimeConfigs, config) == _.get(defaultConfigs, 'properties.' + config + '.default')
          ? 'default'
          : 'redacted'
      _.set(runtimeConfigs, config, defaultOrRedacted)
    }
    return runtimeConfigs
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

      for (const config of modulesConfigsBlacklist[module]) {
        const defaultOrRedacted = _.get(defaultValue, config) == _.get(runtimeValue, config) ? 'default' : 'redacted'
        _.set(runtimeValue, config, defaultOrRedacted)
      }
      return { botId, module, configs: runtimeValue }
    }
  }

  private async getBotsConfigs(): Promise<BotConfigEvent[]> {
    const defaultConfigs = await this.ghostService
      .root()
      .readFileAsObject('/', 'bot.config.schema.json')
      .catch(_err => this.ghostService.root().readFileAsObject('/', 'bot.config.schema.json'))

    const bots = await this.botService.getBots()
    const configs: BotConfigEvent[] = []

    for (const [id, config] of bots) {
      const botId = calculateHash(id)
      const botConfigs = this.formatBotConfigs(config, defaultConfigs)
      configs.push({ botId, botConfigs })
    }

    return configs
  }

  private formatBotConfigs(configs: BotConfig, defaultConfigs) {
    return {
      ...this.replaceBlacklistedConfigs(configs, defaultConfigs, botConfigsBlacklist),
      details: this.formatBotDetails(configs.details),
      id: calculateHash(configs.id),
      name: calculateHash(configs.name)
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
}

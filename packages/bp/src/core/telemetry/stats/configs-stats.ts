import { BotDetails } from 'botpress/sdk'
import { BUILTIN_MODULES } from 'common/defaults'
import LicensingService from 'common/licensing-service'
import { buildSchema, TelemetryEvent } from 'common/telemetry'
import { BotService } from 'core/bots'
import { GhostService } from 'core/bpfs'
import { BotConfig, BotpressConfig, ConfigProvider } from 'core/config'
import Database from 'core/database'
import { JobService } from 'core/distributed'
import { calculateHash } from 'core/misc/utils'
import { ModuleLoader, ModuleConfig } from 'core/modules'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import defaultJsonBuilder from 'json-schema-defaults'
import _ from 'lodash'
import ms from 'ms'

import { TelemetryRepository } from '../telemetry-repository'
import { DEFAULT, REDACTED, TelemetryStats } from './telemetry-stats'

const SECRET_KEYS = [
  'secret',
  'pw',
  'password',
  'token',
  'key',
  'promoted_by',
  'description',
  'admins',
  'email',
  'connection',
  'appId',
  's3',
  'cert',
  'authstrategies',
  'ducklingurl',
  'languagesources'
]

interface BotConfigEvent {
  botId: string
  botConfig: BotConfig
}

interface ModuleConfigEvent {
  botId: string
  module: string
  config: ModuleConfig
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

  protected async getStats(): Promise<TelemetryEvent> {
    const temp = {
      ...buildSchema(await this.getServerStats(), 'server'),
      event_type: 'configs',
      event_data: {
        schema: '1.0.0',
        botConfigs: await this.getBotsConfigs(),
        modulesConfigs: await this.getModulesConfigs(),
        botpressConfig: await this.getBotpressConfig()
      }
    }
    return temp
  }

  private obfuscateSecrets(config, defaultConfig): any {
    return _.reduce(
      config,
      (res, value, key) => {
        if (SECRET_KEYS.find(x => key.toLowerCase().includes(x))) {
          res[key] = _.isEqual(config[key], defaultConfig?.[key] ?? {}) ? DEFAULT : REDACTED
        } else if (!_.isArray(value) && _.isObject(value)) {
          res[key] = this.obfuscateSecrets(value, defaultConfig?.[key] ?? {})
        } else {
          res[key] = value
        }
        return res
      },
      {}
    )
  }

  private async fetchSchema(schemaName: string): Promise<any> {
    try {
      return this.ghostService.root().readFileAsObject('/', schemaName)
    } catch (error) {
      return {}
    }
  }

  private async getBotpressConfig(): Promise<BotpressConfig> {
    const botpressConfig = this.obfuscateModulesLocation(await this.config.getBotpressConfig())
    const defaultConfig = defaultJsonBuilder(await this.fetchSchema('botpress.config.schema.json'))

    return this.obfuscateSecrets(botpressConfig, defaultConfig)
  }

  private obfuscateModulesLocation(botpressConfig: BotpressConfig) {
    const modules = botpressConfig.modules.map(module => {
      if (BUILTIN_MODULES.includes(module.location.split('/').pop() || '')) {
        return module
      } else {
        return { location: REDACTED, enabled: module.enabled }
      }
    })
    return { ...botpressConfig, modules }
  }

  private async getModulesConfigs(): Promise<ModuleConfigEvent[]> {
    const bots = BotService.getMountedBots()
    const modules = _.intersection(BUILTIN_MODULES, Object.keys(process.LOADED_MODULES))

    return (await Promise.map(modules, this.getConfigsByModule(bots)))
      .reduce((acc, cur) => [...acc, ...cur])
      .filter(moduleConfig => _.size(moduleConfig.config) > 0)
  }

  private getConfigsByModule(bots: string[]): (module: string) => Promise<ModuleConfigEvent[]> {
    return async module => {
      const defaultValue = await this.moduleLoader.configReader.loadFromDefaultValues(module)
      return Promise.map(bots, this.getModuleConfigPerBot(module, defaultValue))
    }
  }

  private getModuleConfigPerBot(module: string, defaultValue: any): (botId: any) => Promise<ModuleConfigEvent> {
    return async botId => {
      const runtimeValue = _.omit(await this.moduleLoader.configReader.getForBot(module, botId), '$schema')

      return { module, botId: calculateHash(botId), config: this.obfuscateSecrets(runtimeValue, defaultValue) }
    }
  }

  private async getBotsConfigs(): Promise<BotConfigEvent[]> {
    const defaultConfig = defaultJsonBuilder(await this.fetchSchema('bot.config.schema.json'))
    const bots = await this.botService.getBots()

    return [...bots].reduce((acc: any[], bot) => {
      const [botId, botConfig] = bot
      return [...acc, { botId: calculateHash(botId), botConfig: this.formatBotConfig(botConfig, defaultConfig) }]
    }, [])
  }

  private formatBotConfig(botConfig: BotConfig, defaultConfig): BotConfig {
    return {
      ...this.obfuscateSecrets(botConfig, defaultConfig),
      details: this.formatBotDetails(botConfig.details),
      id: calculateHash(botConfig.id),
      name: calculateHash(botConfig.name)
    }
  }

  private formatBotDetails(details: BotDetails): BotDetails {
    const detailKeys = [
      'website',
      'phoneNumber',
      'termsConditions',
      'emailAddress',
      'avatarUrl',
      'coverPictureUrl',
      'privacyPolicy'
    ]
    return detailKeys.reduce((acc, key) => ({ ...acc, [key]: details[key] ? REDACTED : DEFAULT }), {})
  }
}

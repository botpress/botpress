import { BotConfig } from 'botpress/runtime-sdk'
import { BotDetails } from 'botpress/sdk'
import fse from 'fs-extra'
import { inject, injectable } from 'inversify'
import defaultJsonBuilder from 'json-schema-defaults'
import _ from 'lodash'
import ms from 'ms'
import path from 'path'

import { buildSchema, TelemetryEvent } from '../../../common/telemetry'
import { BotService } from '../../bots'
import { GhostService } from '../../bpfs'
import { RuntimeConfig, ConfigProvider } from '../../config'
import Database from '../../database'
import { JobService } from '../../distributed'
import { calculateHash } from '../../misc/utils'
import { TYPES } from '../../types'

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

@injectable()
export class ConfigsStats extends TelemetryStats {
  protected interval: number
  protected url: string
  protected lock: string

  constructor(
    @inject(TYPES.GhostService) ghostService: GhostService,
    @inject(TYPES.Database) database: Database,
    @inject(TYPES.JobService) jobService: JobService,
    @inject(TYPES.TelemetryRepository) telemetryRepo: TelemetryRepository,
    @inject(TYPES.BotService) private botService: BotService,
    @inject(TYPES.ConfigProvider) private config: ConfigProvider
  ) {
    super(ghostService, database, jobService, telemetryRepo)
    this.url = process.TELEMETRY_URL
    this.lock = 'botpress:telemetry-configs'
    this.interval = ms('7d')
  }

  protected async getStats(): Promise<TelemetryEvent> {
    const temp = {
      ...buildSchema(await this.getServerStats(), 'server'),
      event_type: 'configs',
      event_data: {
        schema: '2.0.0',
        botConfigs: await this.getBotsConfigs(),
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
      return fse.readJson(path.resolve(__dirname, '../../config/schemas', schemaName))
    } catch (error) {
      return {}
    }
  }

  private async getBotpressConfig(): Promise<RuntimeConfig> {
    const botpressConfig = await this.config.getRuntimeConfig()
    const defaultConfig = defaultJsonBuilder(await this.fetchSchema('runtime.config.schema.json'))

    return this.obfuscateSecrets(botpressConfig, defaultConfig)
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

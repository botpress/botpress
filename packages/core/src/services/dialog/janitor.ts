import { BotpressEvent, WellKnownEventTypes } from 'botpress-module-sdk'
import { inject, injectable, postConstruct } from 'inversify'
import moment from 'moment'

import { BotLoader } from '../../bot-loader'
import { BotConfig } from '../../config/bot.config'
import { BotpressConfig } from '../../config/botpress.config'
import { ConfigProvider } from '../../config/config-loader'
import { TYPES } from '../../misc/types'
import { EventEngine } from '../middleware/event-engine'

import { DialogEngine, Timeout } from './engine'
import { SessionService } from './session/service'

export interface Janitor {
  run(): Promise<void>
  install(): void
  uninstall(): void
}

@injectable()
export class DialogSessionJanitor implements Janitor {
  private intervalRef
  private defaultJanitorInterval!: number
  private defaultTimeoutInterval!: number

  constructor(
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.SessionService) private sessionService: SessionService,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.BotLoader) private botLoader: BotLoader,
    @inject(TYPES.DialogEngine) private dialogEngine: DialogEngine
  ) {}

  @postConstruct()
  async initialize() {
    const config = await this.configProvider.getBotpressConfig()
    this.defaultJanitorInterval = config.dialog.janitorInterval
    this.defaultTimeoutInterval = config.dialog.timeoutInterval
  }

  async run() {
    await this.timeoutSessions()
  }

  install() {
    console.log('START JANITOR')
    if (this.intervalRef) {
      this.uninstall()
    }

    this.intervalRef = setInterval(async () => await this.run(), this.defaultJanitorInterval)
  }

  uninstall() {
    if (this.intervalRef) {
      clearInterval(this.intervalRef)
      this.intervalRef = undefined
    }
  }

  protected async timeoutSessions() {
    console.log('TIMING OUT!')
    const botsConfigs = await this.botLoader.getAllBots()
    const botsIds = Array.from(botsConfigs.keys())

    await Promise.map(botsIds, async botId => {
      const config = botsConfigs.get(botId)!
      const timeoutInterval = config.dialog!.timeoutInterval || this.defaultTimeoutInterval
      const outdatedDate = this.getOudatedDate(timeoutInterval)
      const sessionsIds = this.sessionService.getIdsActivatedBeforeDate(botId, outdatedDate)

      await Promise.map(sessionsIds, async sessionId => {
        console.log('TIMING OUT - ', sessionId)
        await this.dialogEngine.processTimeout(botId, sessionId)
      })
    })
  }

  protected getOudatedDate(timeoutInterval): Date {
    return moment()
      .subtract(timeoutInterval, 'milliseconds')
      .toDate()
  }
}

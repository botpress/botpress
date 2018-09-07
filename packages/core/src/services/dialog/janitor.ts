import { Logger } from 'botpress-module-sdk'
import { inject, injectable, postConstruct } from 'inversify'
import _ from 'lodash'
import moment from 'moment'

import { BotLoader } from '../../bot-loader'
import { ConfigProvider } from '../../config/config-loader'
import { TYPES } from '../../misc/types'

import { DialogEngine } from './engine'
import { SessionService } from './session/service'

@injectable()
export class Janitor {
  private intervalRef
  private defaultJanitorInterval!: number
  private defaultTimeoutInterval!: number

  constructor(
    @inject(TYPES.SessionService) private sessionService: SessionService,
    @inject(TYPES.BotLoader) private botLoader: BotLoader,
    @inject(TYPES.DialogEngine) private dialogEngine: DialogEngine,
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider
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
    this.logger.debug('Installing Janitor')
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
    const botsConfigs = await this.botLoader.getAllBots()
    const botsIds = Array.from(botsConfigs.keys())

    await Promise.map(botsIds, async botId => {
      const config = botsConfigs.get(botId)!
      const timeoutInterval = config.dialog!.timeoutInterval || this.defaultTimeoutInterval
      const outdatedDate = this.getOutdatedDate(timeoutInterval)
      const sessionsIds = await this.sessionService.getIdsActivatedBeforeDate(botId, outdatedDate)

      if (sessionsIds.length > 0) {
        this.logger.debug(`🔎 Found inactive sessions: ${sessionsIds.map(session => _.get(session, 'id')).join(', ')}`)
      }

      sessionsIds.map(async sessionId => {
        const id = _.get(sessionId, 'id')
        await this.dialogEngine.processTimeout(botId, id)
      })
    })
  }

  protected getOutdatedDate(timeoutInterval): Date {
    return moment()
      .subtract(timeoutInterval, 'milliseconds')
      .toDate()
  }
}

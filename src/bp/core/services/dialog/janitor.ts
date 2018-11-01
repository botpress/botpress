import { Logger } from 'botpress/sdk'
import { IOEvent } from 'core/sdk/impl'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import { Memoize } from 'lodash-decorators'
import moment from 'moment'
import ms from 'ms'

import { BotLoader } from '../../bot-loader'
import { BotpressConfig } from '../../config/botpress.config'
import { ConfigProvider } from '../../config/config-loader'
import { TYPES } from '../../types'
import { Janitor } from '../janitor'

import { DialogEngineV2 } from './engine-v2'
import { SessionIdFactory } from './session/id-factory'
import { SessionService } from './session/service'

@injectable()
export class DialogJanitor extends Janitor {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'DialogJanitor')
    protected logger: Logger,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.DialogEngine) private dialogEngine: DialogEngineV2,
    @inject(TYPES.BotLoader) private botLoader: BotLoader,
    @inject(TYPES.SessionService) private sessionService: SessionService
  ) {
    super(logger)
  }

  @Memoize
  private async getBotpresConfig(): Promise<BotpressConfig> {
    return this.configProvider.getBotpressConfig()
  }

  protected async getInterval(): Promise<string> {
    const config = await this.getBotpresConfig()
    return config.dialog.janitorInterval
  }

  protected async runTask(): Promise<void> {
    // Bot config can change at runtime
    const botpressConfig = await this.getBotpresConfig()
    const botsConfigs = await this.botLoader.getAllBots()
    const botsIds = Array.from(botsConfigs.keys())

    await Promise.mapSeries(botsIds, async botId => {
      const botsConfigs = await this.botLoader.getAllBots()
      const botConfig = botsConfigs.get(botId)
      const expiryTime = ms(_.get(botConfig, 'dialog.timeoutInterval') || botpressConfig.dialog.timeoutInterval)
      const outdatedDate = moment()
        .subtract(expiryTime, 'ms')
        .toDate()

      const sessionsIds = await this.sessionService.getStaleSessionsIds(botId, outdatedDate)
      if (sessionsIds.length > 0) {
        this.logger.forBot(botId).debug(`🔎 Found inactive sessions: ${sessionsIds.join(', ')}`)
      }

      await Promise.mapSeries(sessionsIds, async id => {
        try {
          const target = SessionIdFactory.createTargetFromId(id)

          // This event only exists so that processTimeout can call processEvent
          const fakeEvent = new IOEvent({
            type: 'timeout',
            channel: 'web',
            target: target,
            direction: 'incoming',
            payload: '',
            botId: botId
          })
          await this.dialogEngine.processTimeout(botId, id, fakeEvent)
        } catch (err) {
          // We delete the session in both cases
        } finally {
          await this.sessionService.deleteSession(id)
        }
      })
    })
  }
}

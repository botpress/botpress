import { Logger } from 'botpress-module-sdk'
import { inject, injectable } from 'inversify'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'

import { BotLoader } from '../../bot-loader'
import { ConfigProvider } from '../../config/config-loader'
import Database from '../../database'
import { TYPES } from '../../misc/types'
import { JanitorRunner } from '../janitor'

import { DialogEngine } from './engine'
import { SessionService } from './session/service'

@injectable()
export class DialogJanitorRunner extends JanitorRunner {
  constructor(
    @inject(TYPES.Logger) protected logger: Logger,
    @inject(TYPES.Database) protected database: Database,
    @inject(TYPES.ConfigProvider) protected configProvider: ConfigProvider,
    @inject(TYPES.DialogEngine) private dialogEngine: DialogEngine,
    @inject(TYPES.BotLoader) private botLoader: BotLoader,
    @inject(TYPES.SessionService) private sessionService: SessionService
  ) {
    super(logger, database, configProvider)
  }

  async runTask(): Promise<void> {
    const botsConfigs = await this.botLoader.getAllBots()
    const botsIds = Array.from(botsConfigs.keys())

    await Promise.map(botsIds, async botId => {
      const config = botsConfigs.get(botId)!
      const timeoutInterval = ms(config.dialog!.timeoutInterval) || this.defaultTimeoutInterval
      const outdatedDate = moment()
        .subtract(timeoutInterval, 'ms')
        .toDate()

      const sessionsIds = await this.sessionService.getStaleSessionsIds(botId, outdatedDate)
      if (sessionsIds.length > 0) {
        this.logger.debug(`🔎 Found inactive sessions: ${sessionsIds.join(', ')}`)
      }

      await Promise.map(sessionsIds, async id => {
        try {
          await this.dialogEngine.processTimeout(botId, id)
        } catch (err) {
          this.sessionService.deleteSession(id)
        }
      })
    })
  }
}

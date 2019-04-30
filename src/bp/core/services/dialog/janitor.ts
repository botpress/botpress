import { IO, Logger } from 'botpress/sdk'
import { SessionRepository } from 'core/repositories'
import { Event, IOEvent } from 'core/sdk/impl'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import { Memoize } from 'lodash-decorators'

import { BotpressConfig } from '../../config/botpress.config'
import { ConfigProvider } from '../../config/config-loader'
import { TYPES } from '../../types'
import { BotService } from '../bot-service'
import { Janitor } from '../janitor'

import { DialogEngine } from './dialog-engine'
import { SessionIdFactory } from './session/id-factory'

@injectable()
export class DialogJanitor extends Janitor {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'DialogJanitor')
    protected logger: Logger,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.DialogEngine) private dialogEngine: DialogEngine,
    @inject(TYPES.BotService) private botService: BotService,
    @inject(TYPES.SessionRepository) private sessionRepo: SessionRepository
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
    const botsConfigs = await this.botService.getBots()
    const botsIds = Array.from(botsConfigs.keys())

    await Promise.mapSeries(botsIds, async botId => {
      await this.sessionRepo.deleteExpiredSessions(botId)

      const sessionsIds = await this.sessionRepo.getExpiredContextSessionIds(botId)
      if (sessionsIds.length > 0) {
        this.logger.forBot(botId).debug(`🔎 Found inactive sessions: ${sessionsIds.join(', ')}`)
      }

      await Promise.mapSeries(sessionsIds, async id => {
        try {
          const channel = SessionIdFactory.createChannelFromId(id)
          const target = SessionIdFactory.createTargetFromId(id)
          const threadId = SessionIdFactory.createThreadIdFromId(id)
          const session = await this.sessionRepo.get(id)

          // This event only exists so that processTimeout can call processEvent
          const fakeEvent = Event({
            type: 'timeout',
            channel: channel,
            target: target,
            threadId: threadId,
            direction: 'incoming',
            payload: '',
            botId: botId
          }) as IO.IncomingEvent

          fakeEvent.state.context = session.context as IO.DialogContext
          fakeEvent.state.session = session.session_data as IO.CurrentSession

          await this.dialogEngine.processTimeout(botId, id, fakeEvent)
        } catch (err) {
          // We delete the session in both cases
        } finally {
          const session = await this.sessionRepo.get(id)
          session.context = undefined
          session.temp_data = undefined
          session.context_expiry = undefined
          await this.sessionRepo.update(session)
        }
      })
    })
  }
}

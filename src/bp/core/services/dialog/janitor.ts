import { BotConfig, IO, Logger } from 'botpress/sdk'
import { createExpiry } from 'core/misc/expiry'
import { SessionRepository } from 'core/repositories'
import { Event } from 'core/sdk/impl'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import { Memoize } from 'lodash-decorators'

import { BotpressConfig } from '../../config/botpress.config'
import { ConfigProvider } from '../../config/config-loader'
import { TYPES } from '../../types'
import { BotService } from '../bot-service'
import { Janitor } from '../janitor'

import { DialogEngine } from './dialog-engine'
import { TimeoutNodeNotFound } from './errors'
import { SessionIdFactory } from './session/id-factory'

const debug = DEBUG('janitor')
const dialogDebug = debug.sub('dialog')

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

  @Memoize()
  private async getBotpresConfig(): Promise<BotpressConfig> {
    return this.configProvider.getBotpressConfig()
  }

  protected async getInterval(): Promise<string> {
    const config = await this.getBotpresConfig()
    return config.dialog.janitorInterval
  }

  /**
   * Deletes the sessions that are expired and
   * reset the contexts of the sessions that are stale.
   * These actions are executed based on two expiries: session_expiry and context_expiry.
   */
  protected async runTask(): Promise<void> {
    dialogDebug('Running task')

    const botsConfigs = await this.botService.getBots()
    const botsIds = Array.from(botsConfigs.keys())

    for (const botId of botsIds) {
      await this.sessionRepo.deleteExpiredSessions(botId)
      const sessionsIds = await this.sessionRepo.getExpiredContextSessionIds(botId)

      if (sessionsIds.length > 0) {
        dialogDebug.forBot(botId, 'Found stale sessions', sessionsIds)
        for (const sessionId of sessionsIds) {
          await this._processSessionTimeout(sessionId, botId, botsConfigs.get(botId)!)
        }
      }
    }
  }

  private async _processSessionTimeout(sessionId: string, botId: string, botConfig: BotConfig) {
    dialogDebug.forBot(botId, 'Processing timeout', sessionId)

    try {
      const channel = SessionIdFactory.createChannelFromId(sessionId)
      const target = SessionIdFactory.createTargetFromId(sessionId)
      const threadId = SessionIdFactory.createThreadIdFromId(sessionId)
      const session = await this.sessionRepo.get(sessionId)

      // Don't process the timeout when the context is empty.
      // This means the conversation has not began.
      if (_.isEmpty(session.context)) {
        dialogDebug.forBot(botId, 'Skipping. No changes in context', sessionId)
        return
      }

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

      await this.dialogEngine.processTimeout(botId, sessionId, fakeEvent)
    } catch (error) {
      this._handleError(error, botId)
    } finally {
      await this._resetContext(botId, botConfig, sessionId)
    }
  }

  private _handleError(error, botId) {
    if (error instanceof TimeoutNodeNotFound) {
      dialogDebug.forBot(botId, 'No timeout node found. Clearing context now.')
    } else {
      this.logger.forBot(botId).error(`Could not process the timeout event. ${error.message}`)
    }
  }

  private async _resetContext(botId, botConfig, sessionId) {
    const botpressConfig = await this.getBotpresConfig()
    const expiry = createExpiry(botConfig!, botpressConfig)
    const session = await this.sessionRepo.get(sessionId)

    session.context = {}
    session.temp_data = {}
    session.context_expiry = expiry.context
    session.session_expiry = expiry.session

    await this.sessionRepo.update(session)

    dialogDebug.forBot(botId, `New expiry set for ${session.context_expiry}`, sessionId)
  }
}

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
import { StateManager } from '../middleware/state-manager'

import { DialogEngine } from './dialog-engine'
import { TimeoutNodeNotFound } from './errors'
import { PromptManager } from './prompt-manager'
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
    @inject(TYPES.SessionRepository) private sessionRepo: SessionRepository,
    @inject(TYPES.PromptManager) private promptManager: PromptManager,
    @inject(TYPES.StateManager) private stateManager: StateManager
  ) {
    super(logger)
  }

  @Memoize()
  private async getBotpressConfig(): Promise<BotpressConfig> {
    return this.configProvider.getBotpressConfig()
  }

  protected async getInterval(): Promise<string> {
    const config = await this.getBotpressConfig()
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
      const promptIds = await this.sessionRepo.getExpiredPromptsSessionIds(botId)

      if (sessionsIds.length > 0) {
        dialogDebug.forBot(botId, 'Found stale sessions', sessionsIds)
        for (const sessionId of sessionsIds) {
          await this._processSessionTimeout(sessionId, botId, botsConfigs.get(botId)!)
        }
      }

      await Promise.mapSeries(promptIds, sessionId => this._processPromptTimeout(sessionId, botId))
    }
  }

  private async _processPromptTimeout(sessionId: string, botId: string) {
    try {
      const fakeEvent = this._buildFakeEvent(sessionId, botId)

      await this.stateManager.restore(fakeEvent)

      if (fakeEvent.state.context?.activePrompt) {
        await this.dialogEngine.processTimeout(sessionId, botId, fakeEvent, true)
      }

      await this.sessionRepo.clearPromptTimeoutForSession(sessionId)
    } catch (err) {
      this._handleError(err, botId)
    }
  }

  private async _processSessionTimeout(sessionId: string, botId: string, botConfig: BotConfig) {
    dialogDebug.forBot(botId, 'Processing timeout', sessionId)
    let resetSession = true

    try {
      const fakeEvent = this._buildFakeEvent(sessionId, botId)

      await this.stateManager.restore(fakeEvent)
      const after = await this.dialogEngine.processTimeout(botId, sessionId, fakeEvent)

      if (_.get(after, 'state.context.queue.instructions.length', 0) > 0) {
        // if after processing the timeout handling we still have instructions queued, we're not clearing the context
        resetSession = false
      }
    } catch (error) {
      this._handleError(error, botId)
    } finally {
      await this._resetContext(botId, botConfig, sessionId, resetSession)
    }
  }

  private _handleError(error, botId) {
    if (error instanceof TimeoutNodeNotFound) {
      dialogDebug.forBot(botId, 'No timeout node found. Clearing context now.')
    } else {
      this.logger.forBot(botId).error(`Could not process the timeout event. ${error.message}`)
    }
  }

  private _buildFakeEvent(sessionId: string, botId: string) {
    return Event({
      ...SessionIdFactory.extractDestinationFromId(sessionId),
      type: 'timeout',
      direction: 'incoming',
      payload: '',
      botId
    }) as IO.IncomingEvent
  }

  private async _resetContext(botId, botConfig, sessionId, resetContext: boolean) {
    const botpressConfig = await this.getBotpressConfig()
    const expiry = createExpiry(botConfig!, botpressConfig)
    const session = await this.sessionRepo.get(sessionId)

    if (resetContext) {
      session.context = {}
      session.temp_data = {}
    }

    session.context_expiry = expiry.context
    session.session_expiry = expiry.session

    await this.sessionRepo.update(session)

    dialogDebug.forBot(botId, `New expiry set for ${session.context_expiry}`, sessionId)
  }
}

import { BotConfig, IO, Logger } from 'botpress/sdk'
import { TYPES } from 'core/app/types'
import { BotService } from 'core/bots'
import { BotpressConfig, ConfigProvider } from 'core/config'
import { SessionRepository, createExpiry, SessionIdFactory } from 'core/dialog/sessions'
import { JobService } from 'core/distributed'
import { Event } from 'core/events'
import { Janitor } from 'core/services/janitor'
import { ChannelUserRepository } from 'core/users'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import { Memoize } from 'lodash-decorators'
import ms from 'ms'

import { DialogEngine } from './dialog-engine'
import { TimeoutNodeNotFound } from './errors'

const debug = DEBUG('janitor')
const dialogDebug = debug.sub('dialog')

interface updateArgs {
  resetSession: boolean
  event?: IO.IncomingEvent
}

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
    @inject(TYPES.UserRepository) private userRepo: ChannelUserRepository,
    @inject(TYPES.JobService) private jobService: JobService
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
   * NOTE: This task will run all botpress server nodes and we want only one node to process session timeouts,
   * thus usage of jobService.aquireLock().
   */
  async runTask(): Promise<void> {
    dialogDebug('Running task')

    const botsConfigs = await this.botService.getBots()

    await this.sessionRepo.deleteExpiredSessions()

    const sessionsIds = await this.sessionRepo.getExpiredContextSessionIds()

    if (sessionsIds.length > 0) {
      dialogDebug('Found stale sessions', sessionsIds)
      for (const sessionId of sessionsIds) {
        const { botId } = SessionIdFactory.extractDestinationFromId(sessionId)
        await this._processSessionTimeout(sessionId, botId, botsConfigs.get(botId)!)
      }
    }
  }

  private async _processSessionTimeout(sessionId: string, botId: string, botConfig: BotConfig) {
    dialogDebug.forBot(botId, 'Processing timeout', sessionId)
    const bpConfig = await this.getBotpressConfig()
    const jobTimeout = botConfig.dialog?.sessionTimeoutInterval || bpConfig.dialog.sessionTimeoutInterval
    const lock = await this.jobService.acquireLock(`timeout.${sessionId}`, ms(jobTimeout))
    if (!lock) {
      dialogDebug.forBot(
        botId,
        `Processing timeout skipped for session ${sessionId}, another node is processing timeout`
      )
      return
    }

    const update: updateArgs = { resetSession: true }

    try {
      const { channel, target, threadId } = SessionIdFactory.extractDestinationFromId(sessionId)
      const session = await this.sessionRepo.get(sessionId)

      this.dialogEngine.detectInfiniteLoop(session.context.jumpPoints || [], botId)

      // This event only exists so that processTimeout can call processEvent
      const fakeEvent = Event({
        type: 'timeout',
        channel,
        target,
        threadId,
        direction: 'incoming',
        payload: '',
        botId
      }) as IO.IncomingEvent

      const { result: user } = await this.userRepo.getOrCreate(channel, target, botId)

      // We clean the queue because that processTimeout will return the same event context
      // if there is no jump, so we don't want the timeout event to process the previous queue
      // The reason to return the event is to persist any changes made to session state or context
      // in the session timeout hook
      fakeEvent.state.context = { ...session.context, queue: undefined } as IO.DialogContext
      fakeEvent.state.session = session.session_data as IO.CurrentSession
      fakeEvent.state.user = user.attributes
      fakeEvent.state.temp = session.temp_data

      update.event = await this.dialogEngine.processTimeout(botId, sessionId, fakeEvent)

      if (_.get(update.event, 'state.context.queue.instructions.length', 0) > 0) {
        // if after processing the timeout handling we still have instructions queued, we're not clearing the context
        update.resetSession = false
      }
    } catch (error) {
      this._handleError(error, botId)
    } finally {
      await this._updateState(botId, botConfig, sessionId, update)
      await lock.unlock()
    }
  }

  private _handleError(error: Error, botId: string) {
    if (error instanceof TimeoutNodeNotFound) {
      dialogDebug.forBot(botId, 'No timeout node found. Clearing context now.')
    } else {
      this.logger.forBot(botId).error(`Could not process the timeout event. ${error.message}`)
    }
  }

  private async _updateState(botId: string, botConfig: BotConfig, sessionId: string, update: updateArgs) {
    const botpressConfig = await this.getBotpressConfig()
    const expiry = createExpiry(botConfig!, botpressConfig)
    const session = await this.sessionRepo.get(sessionId)

    if (update.resetSession) {
      session.context = {}
      session.temp_data = {}
    } else {
      session.context = update.event?.state.context || session.context
      session.temp_data = update.event?.state.temp
    }

    session.context_expiry = expiry.context
    session.session_expiry = expiry.session
    session.session_data = update.event?.state.session || session.session_data

    await this.sessionRepo.update(session)

    dialogDebug.forBot(botId, `New expiry set for ${session.context_expiry}`, sessionId)
  }
}

import * as sdk from 'botpress/sdk'
import { BotpressConfig } from 'core/config/botpress.config'
import { ConfigProvider } from 'core/config/config-loader'
import { inject, injectable } from 'inversify'
import _ from 'lodash'
import { Memoize } from 'lodash-decorators'
import moment from 'moment'
import ms from 'ms'

import { SessionRepository, UserRepository } from '../../repositories'
import { TYPES } from '../../types'
import { SessionIdFactory } from '../dialog/session/id-factory'
import { KeyValueStore } from '../kvs'

import { EventEngine } from './event-engine'

@injectable()
export class StateManager {
  constructor(
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.UserRepository) private userRepo: UserRepository,
    @inject(TYPES.SessionRepository) private sessionRepo: SessionRepository,
    @inject(TYPES.KeyValueStore) private kvs: KeyValueStore
  ) {}

  private LAST_MESSAGES_HISTORY_COUNT = 5
  private BOT_GLOBAL_KEY = 'global'

  public async restore(event: sdk.IO.IncomingEvent) {
    const state = event.state

    const { result: user } = await this.userRepo.getOrCreate(event.channel, event.target)
    state.user = user.attributes

    const sessionId = SessionIdFactory.createIdFromEvent(event)
    const session = await this.sessionRepo.get(sessionId)

    state.context = (session && session.context) || {}
    state.session = (session && session.session_data) || { lastMessages: [] }
    state.temp = (session && session.temp_data) || {}
    state.bot = await this.kvs.get(event.botId, this.BOT_GLOBAL_KEY)
  }

  public async persist(event: sdk.IO.IncomingEvent, ignoreContext: boolean) {
    const { user, context, session, temp } = event.state
    const sessionId = SessionIdFactory.createIdFromEvent(event)

    await this.userRepo.setAttributes(event.channel, event.target, _.omitBy(user, _.isNil))

    // Take last 5 messages only
    if (session && session.lastMessages) {
      session.lastMessages = _.takeRight(session.lastMessages, this.LAST_MESSAGES_HISTORY_COUNT)
    }

    const expiryDates = await this.getExpiryDates(event.botId)
    const dialogSession = await this.sessionRepo.getOrCreateSession(sessionId, event.botId)

    dialogSession.session_data = session || {}
    dialogSession.session_expiry = expiryDates.session

    if (!ignoreContext) {
      dialogSession.context = context || {}
      dialogSession.temp_data = temp || {}
      dialogSession.context_expiry = expiryDates.context
    }

    await this.sessionRepo.update(dialogSession)
  }

  private async getExpiryDates(botId: string) {
    const botpressConfig = await this.getBotpresConfig()
    const botConfig = await this.configProvider.getBotConfig(botId)

    const { timeoutInterval, sessionTimeoutInterval } = botpressConfig.dialog
    const contextExpireDate = ms(_.get(botConfig, 'dialog.timeoutInterval') || timeoutInterval)
    const sessionExpireDate = ms(_.get(botConfig, 'dialog.sessionTimeoutInterval') || sessionTimeoutInterval)

    return {
      context: moment()
        .add(contextExpireDate, 'ms')
        .toDate(),
      session: moment()
        .add(sessionExpireDate, 'ms')
        .toDate()
    }
  }

  @Memoize
  private async getBotpresConfig(): Promise<BotpressConfig> {
    return this.configProvider.getBotpressConfig()
  }
}

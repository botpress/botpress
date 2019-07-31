import * as sdk from 'botpress/sdk'
import { BotpressConfig } from 'core/config/botpress.config'
import { ConfigProvider } from 'core/config/config-loader'
import { createExpiry } from 'core/misc/expiry'
import { inject, injectable } from 'inversify'
import _ from 'lodash'
import { Memoize } from 'lodash-decorators'

import { SessionRepository, UserRepository } from '../../repositories'
import { TYPES } from '../../types'
import { SessionIdFactory } from '../dialog/session/id-factory'
import { KeyValueStore } from '../kvs'

@injectable()
export class StateManager {
  constructor(
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
    state.__stacktrace = []
  }

  public async persist(event: sdk.IO.IncomingEvent, ignoreContext: boolean) {
    const { user, context, session, temp } = event.state
    const sessionId = SessionIdFactory.createIdFromEvent(event)

    await this.userRepo.setAttributes(event.channel, event.target, _.omitBy(user, _.isNil))

    // Take last 5 messages only
    if (session && session.lastMessages) {
      session.lastMessages = _.takeRight(session.lastMessages, this.LAST_MESSAGES_HISTORY_COUNT)
    }

    const botConfig = await this.configProvider.getBotConfig(event.botId)
    const botpressConfig = await this.getBotpresConfig()

    const dialogSession = await this.sessionRepo.getOrCreateSession(sessionId, event.botId)
    const expiry = createExpiry(botConfig, botpressConfig)

    dialogSession.session_data = session || {}
    dialogSession.session_expiry = expiry.session
    dialogSession.context_expiry = expiry.context

    // TODO: Document what is the use-case for this block
    if (!ignoreContext) {
      dialogSession.context = context || {}
      dialogSession.temp_data = temp || {}
    }

    await this.sessionRepo.update(dialogSession)
  }

  @Memoize()
  private async getBotpresConfig(): Promise<BotpressConfig> {
    return this.configProvider.getBotpressConfig()
  }
}

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

import { EventEngine } from './event-engine'

@injectable()
export class StateManager {
  constructor(
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.UserRepository) private userRepo: UserRepository,
    @inject(TYPES.SessionRepository) private sessionRepo: SessionRepository
  ) {}

  private LAST_MESSAGES_HISTORY_COUNT = 5

  public initialize() {
    const stateLoader = async (event: sdk.IO.IncomingEvent, next) => {
      const { result: user } = await this.userRepo.getOrCreate(event.channel, event.target)
      event.state.user = user.attributes

      const sessionId = SessionIdFactory.createIdFromEvent(event)
      const session = await this.sessionRepo.get(sessionId)

      event.state.context = (session && session.context_data) || {}
      event.state.session = (session && session.session_data) || { lastMessages: [] }

      next()
    }

    const sessionLoader: sdk.IO.MiddlewareDefinition = {
      order: 0,
      name: 'Session Loader',
      description: 'Loads user data and session',
      direction: 'incoming',
      enabled: true,
      handler: stateLoader
    }

    this.eventEngine.register(sessionLoader)
  }

  public async persist(event: sdk.IO.IncomingEvent, ignoreContext: boolean) {
    const { user, context, session } = event.state
    const sessionId = SessionIdFactory.createIdFromEvent(event)

    await this.userRepo.updateAttributes(event.channel, event.target, _.omitBy(user, _.isNil))

    // Take last 5 messages only
    if (session && session.lastMessages) {
      session.lastMessages = _.takeRight(session.lastMessages, this.LAST_MESSAGES_HISTORY_COUNT)
    }

    const expiryDates = await this.getExpiryDates(event.botId)
    const dialogSession = await this.sessionRepo.getOrCreateSession(sessionId, event.botId)

    dialogSession.session_data = session || {}
    dialogSession.session_expiry = expiryDates.session

    if (!ignoreContext) {
      dialogSession.context_data = context || {}
      dialogSession.context_expiry = expiryDates.context
    }

    await this.sessionRepo.update(dialogSession)
  }

  private async getExpiryDates(botId: string) {
    const botpressConfig = await this.getBotpresConfig()
    const botConfig = await this.configProvider.getBotConfig(botId)

    const contextExpireDate = ms(_.get(botConfig, 'dialog.timeoutInterval') || botpressConfig.dialog.timeoutInterval)
    const sessionExpireDate = ms(_.get(botConfig, 'dialog.timeoutInterval') || botpressConfig.dialog.timeoutInterval)

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

import * as sdk from 'botpress/sdk'
import { BotpressConfig } from 'core/config/botpress.config'
import { ConfigProvider } from 'core/config/config-loader'
import Database from 'core/database'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import { Memoize } from 'lodash-decorators'
import moment from 'moment'
import ms from 'ms'

import { DialogSession, SessionRepository, UserRepository } from '../../repositories'
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
    const stateLoader = async (event: sdk.IO.Event, next) => {
      const { result: user } = await this.userRepo.getOrCreate(event.channel, event.target)
      event.state['user'] = user.attributes

      const sessionId = SessionIdFactory.createIdFromEvent(event)
      const session = await this.sessionRepo.get(sessionId)

      if (session) {
        event.state.context = session.context_data
        event.state.session = session.session_data
      }

      if (!_.get(event, 'state.session.lastMessages')) {
        _.set(event, 'state.session.lastMessages', [])
      }

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

  public async persist(event, ignoreContext) {
    const { user, context, session } = event.state
    const sessionId = SessionIdFactory.createIdFromEvent(event)

    this.userRepo.updateAttributes(event.channel, event.target, _.omitBy(user, _.isNil))

    // Take last 5 messages only
    if (session && session.lastMessages) {
      session.lastMessages = _.slice(session.lastMessages, 0, this.LAST_MESSAGES_HISTORY_COUNT)
    }

    const expiryDates = await this.getContextExpiryDate(event.botId)
    const dialogSession = await this.sessionRepo.getOrCreateSession(sessionId, event.botId)

    dialogSession.session_data = session || {}
    dialogSession.session_expiry = expiryDates.session

    if (!ignoreContext) {
      dialogSession.context_data = context || {}
      dialogSession.context_expiry = expiryDates.context
    }

    await this.sessionRepo.update(dialogSession)
  }

  private async getContextExpiryDate(botId) {
    const botpressConfig = await this.getBotpresConfig()
    const botConfig = await this.configProvider.getBotConfig(botId)

    const expiryTimeContext = ms(_.get(botConfig, 'dialog.timeoutInterval') || botpressConfig.dialog.timeoutInterval)
    const expiryTimeSession = ms(_.get(botConfig, 'dialog.timeoutInterval') || botpressConfig.dialog.timeoutInterval)

    return {
      context: moment()
        .add(expiryTimeContext, 'ms')
        .toDate(),
      session: moment()
        .add(expiryTimeSession, 'ms')
        .toDate()
    }
  }

  @Memoize
  private async getBotpresConfig(): Promise<BotpressConfig> {
    return this.configProvider.getBotpressConfig()
  }
}

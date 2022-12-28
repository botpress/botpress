import * as sdk from 'botpress/sdk'
import { TYPES } from 'core/app/types'
import { BotpressConfig, ConfigProvider } from 'core/config'
import Database from 'core/database'
import { JobService, makeRedisKey } from 'core/distributed'
import { KeyValueStore } from 'core/kvs'
import { ChannelUserRepository } from 'core/users'
import { inject, injectable, tagged } from 'inversify'
import { Redis } from 'ioredis'
import Knex from 'knex'
import _ from 'lodash'
import { Memoize } from 'lodash-decorators'
import ms from 'ms'
import yn from 'yn'

import { createExpiry } from './sessions/expiry'
import { SessionIdFactory } from './sessions/session-id-factory'
import { SessionRepository } from './sessions/session-repository'

const getRedisSessionKey = (sessionId: string) => makeRedisKey(`sessionstate_${sessionId}`)
const BATCH_SIZE = 100
const MEMORY_PERSIST_INTERVAL = ms('5s')
const REDIS_MEMORY_DURATION = ms('30s')

@injectable()
export class StateManager {
  private _redisClient!: Redis
  private batch!: { event: sdk.IO.IncomingEvent; ignoreContext?: boolean }[]
  private knex!: sdk.KnexExtended
  private currentPromise?: Promise<void>
  private useRedis: boolean

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'StateManager')
    private logger: sdk.Logger,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.UserRepository) private userRepo: ChannelUserRepository,
    @inject(TYPES.SessionRepository) private sessionRepo: SessionRepository,
    @inject(TYPES.KeyValueStore) private kvs: KeyValueStore,
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.JobService) private jobService: JobService
  ) {
    // Temporarily opt-in until thoroughly tested
    this.useRedis = process.CLUSTER_ENABLED && yn(process.env.USE_REDIS_STATE)
  }

  public initialize() {
    if (!this.useRedis) {
      return
    }

    this.knex = this.database.knex
    this.batch = []

    const client = this.jobService.getRedisClient()
    if (client) {
      this._redisClient = client
    }

    setInterval(this._runTask, MEMORY_PERSIST_INTERVAL)
  }

  private LAST_MESSAGES_HISTORY_COUNT = 5
  private BOT_GLOBAL_KEY = 'global'

  public async restore(event: sdk.IO.IncomingEvent) {
    const sessionId = SessionIdFactory.createIdFromEvent(event)

    if (this.useRedis) {
      try {
        const userState = await this._redisClient.get(getRedisSessionKey(sessionId))
        if (userState) {
          event.state = JSON.parse(userState)
          event.state.__stacktrace = []
          return
        }
      } catch (err) {
        this.logger.attachError(err).error('Error reading user state from Redis')
      }
    }

    const state = event.state

    const { result: user } = await this.userRepo.getOrCreate(event.channel, event.target, event.botId)
    state.user = user.attributes

    const session = await this.sessionRepo.get(sessionId)

    state.context = (session && session.context) || {}
    state.session = (session && session.session_data) || { lastMessages: [], workflows: {} }
    state.temp = (session && session.temp_data) || {}
    state.bot = await this.kvs.forBot(event.botId).get(this.BOT_GLOBAL_KEY)
    state.__stacktrace = []

    if (!state.workflow) {
      Object.defineProperty(state, 'workflow', {
        get() {
          return state.session.workflows[state.session.currentWorkflow!]
        },
        configurable: true
      })
    }
  }

  public async persist(event: sdk.IO.IncomingEvent, ignoreContext: boolean) {
    const sessionId = SessionIdFactory.createIdFromEvent(event)

    if (this.useRedis) {
      await this._redisClient.set(
        getRedisSessionKey(sessionId),
        JSON.stringify(_.omit(event.state, ['__stacktrace', 'workflow'])),
        'PX',
        REDIS_MEMORY_DURATION
      )
      this.batch.push({ event, ignoreContext })
      return
    }

    await this._saveState(event, ignoreContext)
  }

  public async deleteDialogSession(sessionId: string) {
    await this.sessionRepo.delete(sessionId)

    if (this.useRedis) {
      await this._redisClient.del(getRedisSessionKey(sessionId))
    }
  }

  private async _saveState(event: sdk.IO.IncomingEvent, ignoreContext?: boolean, trx?: Knex.Transaction) {
    const { user, context, session, temp } = event.state
    const sessionId = SessionIdFactory.createIdFromEvent(event)

    await this.userRepo.setAttributes(event.channel, event.target, _.omitBy(user, _.isNil), trx)

    // Take last 5 messages only
    if (session && session.lastMessages) {
      session.lastMessages = _.takeRight(session.lastMessages, this.LAST_MESSAGES_HISTORY_COUNT)
    }

    const botConfig = await this.configProvider.getBotConfig(event.botId)
    const botpressConfig = await this.getBotpressConfig()

    const dialogSession = await this.sessionRepo.getOrCreateSession(sessionId, trx)
    const expiry = createExpiry(botConfig, botpressConfig)

    dialogSession.session_data = session || {}
    dialogSession.session_expiry = expiry.session
    dialogSession.context_expiry = expiry.context

    // TODO: Document what is the use-case for this block
    if (!ignoreContext) {
      dialogSession.context = context || {}
      dialogSession.temp_data = temp || {}
    }

    await this.sessionRepo.update(dialogSession, trx)
  }

  private _runTask = async () => {
    if (this.currentPromise || !this.batch || !this.batch.length) {
      return
    }

    const batchCount = this.batch.length >= BATCH_SIZE ? BATCH_SIZE : this.batch.length
    const elements = this.batch.slice(0, batchCount)

    this.currentPromise = this.knex
      .transaction(async trx => {
        for (const { event, ignoreContext } of elements) {
          await this._saveState(event, ignoreContext, trx)
          _.remove(this.batch, { event })
        }
      })
      .finally(() => {
        this.currentPromise = undefined
      })
  }

  @Memoize()
  private async getBotpressConfig(): Promise<BotpressConfig> {
    return this.configProvider.getBotpressConfig()
  }
}

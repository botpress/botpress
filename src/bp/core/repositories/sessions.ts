import * as sdk from 'botpress/sdk'
import { SessionIdFactory } from 'core/services/dialog/session/id-factory'
import { JobService } from 'core/services/job-service'
import { inject, injectable, postConstruct } from 'inversify'
import Knex from 'knex'
import _ from 'lodash'

import LRU from 'lru-cache'
import ms from 'ms'
import Database from '../database'
import { TYPES } from '../types'

export class DialogSession {
  constructor(
    public id: string,
    public context: sdk.IO.DialogContext = {},
    public temp_data: any = {},
    public session_data: sdk.IO.CurrentSession = { lastMessages: [], workflows: {} }
  ) {}

  // Timestamps are optional because they have default values in the database
  created_on?: Date
  modified_on?: Date
  context_expiry?: Date
  session_expiry?: Date
}

export interface SessionRepository {
  insert(session: DialogSession): Promise<DialogSession>
  getOrCreateSession(sessionId: string, trx?: Knex.Transaction): Promise<DialogSession>
  get(id: string): Promise<DialogSession>
  getExpiredContextSessionIds(): Promise<string[]>
  deleteExpiredSessions(): Promise<void>
  delete(id: string): Promise<void>
  update(session: DialogSession, trx?: Knex.Transaction): Promise<void>
}

@injectable()
export class KnexSessionRepository implements SessionRepository {
  private readonly tableName = 'dialog_sessions'
  private cache = new LRU<string, DialogSession>({ max: 10000, maxAge: ms('5min') })
  private invalidateSessionCache: (id: string, owner?: number) => void = this._localInvalidateSessionCache
  private ownerId: number = Math.random() * 10000000 + 1

  constructor(
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.JobService) private jobService: JobService
  ) {}

  @postConstruct()
  async init() {
    this.invalidateSessionCache = <any>(
      await this.jobService.broadcast<void>(this._localInvalidateSessionCache.bind(this))
    )
  }

  async getOrCreateSession(sessionId: string, trx?: Knex.Transaction): Promise<DialogSession> {
    const session = await this.get(sessionId)
    if (!session) {
      const session = new DialogSession(sessionId, {}, {}, { lastMessages: [], workflows: {} })
      const { botId, channel } = SessionIdFactory.extractDestinationFromId(sessionId)
      BOTPRESS_CORE_EVENT('bp_core_session_created', { botId, channel })
      return this.insert(session, trx)
    }
    return session
  }

  async insert(session: DialogSession, trx?: Knex.Transaction): Promise<DialogSession> {
    const newSession = await this.database.knex.insertAndRetrieve<DialogSession>(
      this.tableName,
      {
        id: session.id,
        context: this.database.knex.json.set(session.context || {}),
        temp_data: this.database.knex.json.set(session.temp_data || {}),
        session_data: this.database.knex.json.set(session.session_data || {}),
        modified_on: this.database.knex.date.now(),
        created_on: this.database.knex.date.now(),
        context_expiry: session.context_expiry ? this.database.knex.date.format(session.context_expiry) : eval('null'),
        session_expiry: session.session_expiry ? this.database.knex.date.format(session.session_expiry) : eval('null')
      },
      ['id', 'context', 'temp_data', 'session_data', 'modified_on', 'created_on'],
      undefined,
      trx
    )

    if (newSession) {
      newSession.context = this.database.knex.json.get(newSession.context)
      newSession.temp_data = this.database.knex.json.get(newSession.temp_data)
      newSession.session_data = this.database.knex.json.get(newSession.session_data)

      this.cache.set(newSession.id, newSession)
    }

    return newSession
  }

  async get(id: string): Promise<DialogSession> {
    const cached = this.cache.get(id)
    if (cached) {
      return cached
    }

    const session = <DialogSession>await this.database
      .knex<DialogSession>(this.tableName)
      .where({ id })
      .select('*')
      .first()
      .then()

    if (session) {
      session.context = this.database.knex.json.get(session.context)
      session.temp_data = this.database.knex.json.get(session.temp_data)
      session.session_data = this.database.knex.json.get(session.session_data)

      this.invalidateSessionCache(session.id, this.ownerId)
      this.cache.set(session.id, session)
    }

    return session
  }

  async getExpiredContextSessionIds(): Promise<string[]> {
    let query = this.database
      .knex(this.tableName)
      .andWhere(this.database.knex.date.isBefore('context_expiry', new Date()))

    // We only process expired context if there is actually a context
    if (this.database.knex.isLite) {
      query = query.andWhereRaw(this.database.knex.raw("context <> '{}' "))
    } else {
      query = query.andWhereRaw(this.database.knex.raw("context::text <> '{}'::text"))
    }

    return (await query
      .select('id')
      .limit(250)
      .orderBy('modified_on')
      .then(rows => {
        return rows.map(r => r.id)
      })) as string[]
  }

  async deleteExpiredSessions(): Promise<void> {
    await this.database
      .knex(this.tableName)
      .andWhere(this.database.knex.date.isBefore('session_expiry', new Date()))
      .del()
  }

  async update(session: DialogSession, trx?: Knex.Transaction): Promise<void> {
    const req = this.database
      .knex(this.tableName)
      .where({ id: session.id })
      .update({
        context: this.database.knex.json.set(session.context),
        temp_data: this.database.knex.json.set(session.temp_data),
        session_data: this.database.knex.json.set(session.session_data),
        context_expiry: session.context_expiry ? this.database.knex.date.format(session.context_expiry) : eval('null'),
        session_expiry: session.session_expiry ? this.database.knex.date.format(session.session_expiry) : eval('null'),
        modified_on: this.database.knex.date.now()
      })

    if (trx) {
      await req.transacting(trx)
    }

    await req

    if (this.cache.has(session.id)) {
      this.cache.del(session.id)
    } else {
      this.invalidateSessionCache(session.id)
    }
  }

  async delete(id: string): Promise<void> {
    await this.database
      .knex(this.tableName)
      .where({ id })
      .del()

    if (this.cache.has(id)) {
      this.cache.del(id)
    } else {
      this.invalidateSessionCache(id)
    }
  }

  private _localInvalidateSessionCache(id: string, owner?: number) {
    if (this.ownerId !== owner) {
      this.cache.del(id)
    }
  }
}

import * as sdk from 'botpress/sdk'
import { SessionIdFactory } from 'core/services/dialog/session/id-factory'
import { inject, injectable } from 'inversify'
import Knex from 'knex'
import _ from 'lodash'

import Database from '../database'
import { TYPES } from '../types'

export class DialogSession {
  constructor(
    public id: string,
    public botId: string,
    public context?: sdk.IO.DialogContext,
    public temp_data?: any,
    public session_data?: sdk.IO.CurrentSession
  ) {}

  // Timestamps are optional because they have default values in the database
  created_on?: Date
  modified_on?: Date
  context_expiry?: Date
  session_expiry?: Date
}

export interface SessionRepository {
  insert(session: DialogSession): Promise<DialogSession>
  getOrCreateSession(sessionId: string, botId: string, trx?: Knex.Transaction): Promise<DialogSession>
  get(id: string): Promise<DialogSession>
  getExpiredContextSessionIds(botId: string): Promise<string[]>
  deleteExpiredSessions(botId: string)
  delete(id: string)
  update(session: DialogSession, trx?: Knex.Transaction)
}

@injectable()
export class KnexSessionRepository implements SessionRepository {
  private readonly tableName = 'dialog_sessions'

  constructor(@inject(TYPES.Database) private database: Database) {}

  async getOrCreateSession(sessionId: string, botId: string, trx?: Knex.Transaction): Promise<DialogSession> {
    const session = await this.get(sessionId)
    if (!session) {
      return this.createSession(sessionId, botId, {}, {}, {}, trx)
    }
    return session
  }

  async createSession(
    sessionId,
    botId,
    context,
    temp_data,
    session_data,
    trx?: Knex.Transaction
  ): Promise<DialogSession> {
    const session = new DialogSession(sessionId, botId, context, temp_data, session_data)
    const { channel } = SessionIdFactory.extractDestinationFromId(sessionId)
    BOTPRESS_CORE_EVENT('bp_core_session_created', { botId, channel })
    return this.insert(session, trx)
  }

  async insert(session: DialogSession, trx?: Knex.Transaction): Promise<DialogSession> {
    const newSession = await this.database.knex.insertAndRetrieve<DialogSession>(
      this.tableName,
      {
        id: session.id,
        botId: session.botId,
        context: this.database.knex.json.set(session.context || {}),
        temp_data: this.database.knex.json.set(session.temp_data || {}),
        session_data: this.database.knex.json.set(session.session_data || {}),
        modified_on: this.database.knex.date.now(),
        created_on: this.database.knex.date.now(),
        context_expiry: session.context_expiry ? this.database.knex.date.format(session.context_expiry) : eval('null'),
        session_expiry: session.session_expiry ? this.database.knex.date.format(session.session_expiry) : eval('null')
      },
      ['id', 'botId', 'context', 'temp_data', 'session_data', 'modified_on', 'created_on'],
      undefined,
      trx
    )

    if (newSession) {
      newSession.context = this.database.knex.json.get(newSession.context)
      newSession.temp_data = this.database.knex.json.get(newSession.temp_data)
      newSession.session_data = this.database.knex.json.get(newSession.session_data)
    }
    return newSession
  }

  async get(id: string): Promise<DialogSession> {
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
    }
    return session
  }

  async getExpiredContextSessionIds(botId: string): Promise<string[]> {
    return (await this.database
      .knex(this.tableName)
      .where('botId', botId)
      .andWhere(this.database.knex.date.isBefore('context_expiry', new Date()))
      .select('id')
      .limit(250)
      .orderBy('modified_on')
      .then(rows => {
        return rows.map(r => r.id)
      })) as string[]
  }

  async deleteExpiredSessions(botId: string): Promise<void> {
    await this.database
      .knex(this.tableName)
      .where('botId', botId)
      .andWhere(this.database.knex.date.isBefore('session_expiry', new Date()))
      .del()
  }

  async update(session: DialogSession, trx?: Knex.Transaction): Promise<void> {
    const req = this.database
      .knex(this.tableName)
      .where('id', session.id)
      .update({
        context: this.database.knex.json.set(session.context),
        temp_data: this.database.knex.json.set(session.temp_data),
        session_data: this.database.knex.json.set(session.session_data),
        context_expiry: session.context_expiry ? this.database.knex.date.format(session.context_expiry) : eval('null'),
        session_expiry: session.session_expiry ? this.database.knex.date.format(session.session_expiry) : eval('null'),
        modified_on: this.database.knex.date.now()
      })

    if (trx) {
      req.transacting(trx)
    }

    await req
  }

  async delete(id: string) {
    await this.database
      .knex(this.tableName)
      .where({ id })
      .del()
  }
}

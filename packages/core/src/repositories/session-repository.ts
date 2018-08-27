import { inject, injectable } from 'inversify'

import Database from '../database'
import { TYPES } from '../misc/types'

export type DialogSession = {
  id: string
  state?: string
  context: any
  event: string

  // Timestamps are optionnal because they have default values in the database
  created_on?: Date
  modified_on?: Date
  active_on?: Date
}

export interface SessionRepository {
  insert(session: DialogSession): Promise<DialogSession>
  get(id: string): Promise<DialogSession>
  upsert(session: DialogSession)
  delete(id: string)
  update(session: DialogSession)
}

@injectable()
export class KnexSessionRepository implements SessionRepository {
  private readonly tableName = 'dialog_sessions'

  constructor(@inject(TYPES.Database) private database: Database) {}

  async insert(session: DialogSession): Promise<DialogSession> {
    return this.database.knex.insertAndRetrieve<DialogSession>(this.tableName, {
      id: session.id,
      state: session.state,
      context: session.context,
      event: session.event,
      active_on: this.database.knex.date.now(),
      modified_on: this.database.knex.date.now(),
      created_on: this.database.knex.date.now()
    })
  }

  async get(id: string): Promise<any> {
    return this.database
      .knex(this.tableName)
      .where({ id })
      .select('*')
      .get(0)
      .then(row => <DialogSession>row)
  }

  async upsert(session: DialogSession) {
    const params = {
      tableName: this.tableName,
      id: session.id,
      state: JSON.stringify(session.state),
      context: JSON.stringify(session.context),
      now: this.database.knex.date.now()
    }

    let sql: string
    if (this.database.knex.isLite) {
      sql = `
      INSERT OR REPLACE INTO :tableName: (id, state, context, active_on, created_on, modified_on)
      VALUES (:id, :state, :context, :now, :now, :now)
      `
    } else {
      sql = `
      INSERT INTO :tableName: (id, state, context, active_on, created_on, modified_on)
      VALUES (:id, :state, :context, :now, :now, :now)
      ON CONFLICT (id) DO UPDATE
      SET state = :state, context = :context, active_on = :now, modified_on = :now
      `
    }

    return this.database.knex.raw(sql, params)
  }

  async update(session: DialogSession) {
    const now = this.database.knex.date.now()

    try {
      await this.database
        .knex(this.tableName)
        .where('id', session.id)
        .update({
          active_on: session.active_on,
          modified_on: now,
          state: JSON.stringify(session.state),
          context: JSON.stringify(session.context)
        })
        .then()
    } catch (err) {
      console.log(err)
    }
    return
  }

  async delete(id: string) {
    await this.database
      .knex(this.tableName)
      .where({ id })
      .del()
      .then()
  }

  private async createSession(id: string): Promise<DialogSession> {
    const params = {
      tableName: this.tableName,
      id,
      state: '',
      context: '',
      now: this.database.knex.date.now()
    }

    let sql: string
    if (this.database.knex.isLite) {
      sql = `
      INSERT OR REPLACE INTO :tableName: (id, state, active_on, created_on, modified_on)
      VALUES (:id, :state, :now, :now, :now)
      `
    } else {
      sql = `
      INSERT INTO :tableName: (id, state, active_on, created_on, modified_on)
      VALUES (:id, :state, :now, :now, :now)
      ON CONFLICT (id) DO UPDATE
        SET created_on = :now, active_on = :now, modified_on = :now, state = :state, context = :context
      `
    }

    await this.database.knex.raw(sql, params).then()

    const session = await this.database
      .knex(this.tableName)
      .select('*')
      .where({ id })
      .then(row => <DialogSession>row)
    return this.jsonParse(session)
  }

  private jsonParse(session: DialogSession) {
    session.context = session.context && JSON.parse(session.context)
    session.state = session.state && JSON.parse(session.state)
    return session
  }
}

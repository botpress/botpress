import { inject, injectable } from 'inversify'

import { ExtendedKnex } from '../database/interfaces'
import { TYPES } from '../misc/types'

export type DialogSession = {
  id: string
  namespace?: string
  state?: string
  context?: any
  created_on?: string
  active_on?: string
}

export interface SessionRepository {
  get(id: string): Promise<DialogSession>
  upsert(id: string, state: DialogSession)
  delete(id: string, subsates: any)
  update(id: string, session: DialogSession)
}

@injectable()
export class KnexSessionRepository implements SessionRepository {
  private readonly tableName = 'dialog_sessions'

  constructor(@inject(TYPES.Database) private knex: ExtendedKnex) {}

  async get(id: string): Promise<DialogSession> {
    const session = <DialogSession>await this.knex(this.tableName)
      .where({ id })
      .limit(1)
      .get(0)
      .then()
    return session ? session : this.createSession(id)
  }

  async upsert(id: string, state: any) {
    const params = {
      tableName: this.tableName,
      id,
      state: JSON.stringify(state),
      now: this.knex.date.now()
    }

    const sql = `
        INSERT INTO :tableName: (id, state, active_on, created_on)
        VALUES (:id, :state, :now, :now)
        ON CONFLICT (id) DO UPDATE
          SET active_on = :now, state = :state`

    return this.knex.raw(sql, params)
  }

  async update(id: string, session: DialogSession) {
    return await this.knex(this.tableName)
      .update(session)
      .where({ id })
      .then()
  }

  async delete(id: string, substates = ['context']) {
    const sessions = [id, ...substates.map(x => `${id}___${x}`)]

    await this.knex(this.tableName)
      .whereIn('id', sessions)
      .del()
      .then()
  }

  private createSession(id: string): DialogSession {
    const session: DialogSession = { id }

    const params = {
      tableName: this.tableName,
      id,
      state: JSON.stringify(session.state),
      now: this.knex.date.now()
    }

    const sql = `
    INSERT INTO :tableName: (id, state, active_on, created_on)
    VALUES (:id, :state, :now, :now)
    ON CONFLICT (id) DO UPDATE
      SET created_on = :now, active_on = :now, state = :state`

    this.knex.raw(sql, params)
    return session
  }
}

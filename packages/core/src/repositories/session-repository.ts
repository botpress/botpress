import { inject, injectable } from 'inversify'

import Database from '../database'
import { TYPES } from '../misc/types'

export class DialogSession {
  constructor(public id: string, public state, public context, public event) {}
  // Timestamps are optionnal because they have default values in the database
  created_on?: Date
  modified_on?: Date
  active_on?: Date
}

export interface SessionRepository {
  insert(session: DialogSession): Promise<DialogSession>
  get(id: string): Promise<DialogSession>
  delete(id: string)
  update(session: DialogSession)
}

@injectable()
export class KnexSessionRepository implements SessionRepository {
  private readonly tableName = 'dialog_sessions'

  constructor(@inject(TYPES.Database) private database: Database) {}

  async insert(session: DialogSession): Promise<DialogSession> {
    const newSession = await this.database.knex.insertAndRetrieve<DialogSession>(this.tableName, {
      id: session.id,
      state: JSON.stringify(session.state),
      context: JSON.stringify(session.context),
      event: JSON.stringify(session.event),
      active_on: this.database.knex.date.now(),
      modified_on: this.database.knex.date.now(),
      created_on: this.database.knex.date.now()
    })

    if (newSession) {
      newSession.state = JSON.parse(newSession.state)
      newSession.context = JSON.parse(newSession.context)
      newSession.event = JSON.parse(newSession.event)
    }
    return newSession
  }

  async get(id: string): Promise<DialogSession> {
    const session = <DialogSession>await this.database
      .knex(this.tableName)
      .where({ id })
      .select('*')
      .get(0)
      .then()

    if (session) {
      session.state = JSON.parse(session.state)
      session.context = JSON.parse(session.context)
      session.event = JSON.parse(session.event)
    }
    return session
  }

  async update(session: DialogSession): Promise<void> {
    const now = this.database.knex.date.now()
    await this.database
      .knex(this.tableName)
      .where('id', session.id)
      .update({
        modified_on: now,
        state: JSON.stringify(session.state),
        context: JSON.stringify(session.context),
        event: JSON.stringify(session.event)
      })
      .then()
  }

  async delete(id: string) {
    await this.database
      .knex(this.tableName)
      .where({ id })
      .del()
      .then()
  }
}

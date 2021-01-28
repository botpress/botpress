import * as sdk from 'botpress/sdk'
import { inject, injectable } from 'inversify'

import Database from '../database'
import { TYPES } from '../types'

export interface MessageRepository {
  getAll(conversationId: number): Promise<sdk.Message[]>
  deleteAll(conversationId: number): Promise<number>
  create(
    conversationId: number,
    eventId: string,
    incomingEventId: string,
    from: string,
    payload: any
  ): Promise<sdk.Message>
  getById(messageId: number): Promise<sdk.Message | undefined>
  delete(messageId: number): Promise<boolean>
  query()
  serialize(message: Partial<sdk.Message>)
  deserialize(message: any): sdk.Message
}

@injectable()
export class KnexMessageRepository implements MessageRepository {
  private readonly TABLE_NAME = 'messages'

  constructor(@inject(TYPES.Database) private database: Database) {}

  public async getAll(conversationId: number): Promise<sdk.Message[]> {
    const rows = await this.query()
      .where({ conversationId })
      .orderBy('sentOn')
    return rows.map(x => this.deserialize(x))
  }

  public async deleteAll(conversationId: number): Promise<number> {
    const numberOfDeletedRows = await this.query()
      .where({ conversationId })
      .del()

    return numberOfDeletedRows
  }

  public async create(
    conversationId: number,
    eventId: string,
    incomingEventId: string,
    from: string,
    payload: any
  ): Promise<sdk.Message> {
    const message = {
      conversationId,
      eventId,
      incomingEventId,
      from,
      sentOn: new Date(),
      payload
    }

    const [id] = await this.query()
      .insert(this.serialize(message))
      .returning('id')

    return {
      id,
      ...message
    }
  }

  public async getById(messageId: number): Promise<sdk.Message | undefined> {
    const rows = await this.query()
      .select('*')
      .where({ id: messageId })

    return this.deserialize(rows[0])
  }

  public async delete(messageId: number): Promise<boolean> {
    const numberOfDeletedRows = await this.query()
      .where({ id: messageId })
      .del()

    return numberOfDeletedRows > 0
  }

  public query() {
    return this.database.knex(this.TABLE_NAME)
  }

  public serialize(message: Partial<sdk.Message>) {
    const { conversationId, eventId, incomingEventId, from, sentOn, payload } = message
    return {
      conversationId,
      eventId,
      incomingEventId,
      from,
      sentOn: sentOn?.toISOString(),
      payload: this.database.knex.json.set(payload)
    }
  }

  public deserialize(message: any): sdk.Message {
    const { id, conversationId, eventId, incomingEventId, from, sentOn, payload } = message
    return {
      id,
      conversationId,
      eventId,
      incomingEventId,
      from,
      sentOn: new Date(sentOn),
      payload: this.database.knex.json.get(payload)
    }
  }
}

import * as sdk from 'botpress/sdk'
import { inject, injectable } from 'inversify'

import Database from '../database'
import { TYPES } from '../types'

export interface MessageRepository {
  create(conversationId: number, eventId: string, from: string, payload: any): Promise<sdk.Message>
  getAll(conversationId: number): Promise<sdk.Message[]>
  deleteAll(conversationId: number): Promise<number>
}

@injectable()
export class KnexMessageRepository implements MessageRepository {
  private readonly TABLE_NAME = 'messages'

  constructor(@inject(TYPES.Database) private database: Database) {}

  public async create(conversationId: number, eventId: string, from: string, payload: any): Promise<sdk.Message> {
    const message = {
      conversationId,
      eventId,
      from,
      sentOn: new Date(),
      payload
    }

    const result = await this.query().insert(this.serialize(message))
    const id = result[0]

    return {
      id,
      ...message
    }
  }

  public async getAll(conversationId: number): Promise<sdk.Message[]> {
    const rows = await this.query().where({ conversationId })

    return rows.map(x => this.deserialize(x))
  }

  public async deleteAll(conversationId: number): Promise<number> {
    const numberOfDeletedRows = await this.query()
      .where({ conversationId })
      .del()

    return numberOfDeletedRows
  }

  private query() {
    return this.database.knex(this.TABLE_NAME)
  }

  private serialize(message: Partial<sdk.Message>) {
    return {
      ...message,
      sentOn: message.sentOn?.toISOString(),
      payload: JSON.stringify(message.payload)
    }
  }

  private deserialize(message: any): sdk.Message {
    return {
      ...message,
      sentOn: new Date(message.sentOn),
      payload: JSON.parse(message.payload)
    }
  }
}

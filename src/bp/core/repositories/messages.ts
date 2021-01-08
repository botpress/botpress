import * as sdk from 'botpress/sdk'
import { inject, injectable } from 'inversify'

import Database from '../database'
import { TYPES } from '../types'

export interface MessageRepository {
  create(conversationId: number, eventId: string, payload: any): Promise<sdk.Message>
  getAll(conversationId: number): Promise<sdk.Message[]>
}

@injectable()
export class KnexMessageRepository implements MessageRepository {
  private readonly TABLE_NAME = 'messages'

  constructor(@inject(TYPES.Database) private database: Database) {}

  public async create(conversationId: number, eventId: string, payload: any): Promise<sdk.Message> {
    const row = {
      conversationId,
      eventId: eventId,
      sentOn: this.database.knex.date.now(),
      payload: this.database.knex.json.set(payload)
    }

    const result = await this.query().insert(row)
    const id = result[0]

    // TODO remove <any>
    return <any>{
      id,
      ...row
    }
  }

  public async getAll(conversationId: number): Promise<sdk.Message[]> {
    return await this.query().where({ conversationId })
  }

  private query() {
    return this.database.knex(this.TABLE_NAME)
  }
}

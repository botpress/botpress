import * as sdk from 'botpress/sdk'
import { inject, injectable } from 'inversify'

import Database from '../database'
import { TYPES } from '../types'

export interface ConversationRepository {
  getAll(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation[]>
  deleteAll(endpoint: sdk.UserEndpoint): Promise<number>
  create(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation>
  getMostRecent(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation | undefined>
  getById(conversationId: number): Promise<sdk.Conversation | undefined>
  delete(conversationId: number): Promise<boolean>
}

@injectable()
export class KnexConversationRepository implements ConversationRepository {
  private readonly TABLE_NAME = 'conversations'

  constructor(@inject(TYPES.Database) private database: Database) {}

  public async getAll(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation[]> {
    const rows = await this.query()
      .select('*')
      .where(endpoint)

    return rows.map(x => <sdk.Conversation>this.deserialize(x))
  }

  public async deleteAll(endpoint: sdk.UserEndpoint): Promise<number> {
    const numberOfDeletedRows = await this.query()
      .where(endpoint)
      .del()

    return numberOfDeletedRows
  }

  public async create(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation> {
    const conversation = {
      userId: endpoint.userId,
      botId: endpoint.botId,
      createdOn: new Date()
    }

    const [id] = await this.query()
      .insert(this.serialize(conversation))
      .returning('id')

    return {
      id,
      ...conversation
    }
  }

  public async getMostRecent(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation | undefined> {
    const query = this.query()
      .select('*')
      .where(endpoint)
      // TODO createdOn is not a good measure
      .orderBy('createdOn', 'desc')
      .limit(1)

    const sql = query.toSQL()
    console.log('sql', sql)

    const rows = await query

    return this.deserialize(rows[0])
  }

  public async getById(conversationId: number): Promise<sdk.Conversation | undefined> {
    const rows = await this.query()
      .select('*')
      .where({ id: conversationId })

    return this.deserialize(rows[0])
  }

  public async delete(conversationId: number): Promise<boolean> {
    const numberOfDeletedRows = await this.query()
      .where({ id: conversationId })
      .del()

    return numberOfDeletedRows > 0
  }

  private query() {
    return this.database.knex(this.TABLE_NAME)
  }

  private serialize(conversation: Partial<sdk.Conversation>) {
    return {
      ...conversation,
      createdOn: conversation.createdOn?.toISOString()
    }
  }

  private deserialize(conversation: any): sdk.Conversation | undefined {
    if (!conversation) {
      return undefined
    }

    return {
      ...conversation,
      createdOn: new Date(conversation.createdOn)
    }
  }
}

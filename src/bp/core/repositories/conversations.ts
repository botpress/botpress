import * as sdk from 'botpress/sdk'
import { inject, injectable } from 'inversify'

import Database from '../database'
import { TYPES } from '../types'
import LRU from 'lru-cache'
import ms from 'ms'

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
  private cache = new LRU<number, sdk.Conversation>({ max: 10000, maxAge: ms('5min') })

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

    this.cache.reset()

    return numberOfDeletedRows
  }

  public async create(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation> {
    let row = {
      userId: endpoint.userId,
      botId: endpoint.botId,
      createdOn: new Date()
    }

    const [id] = await this.query()
      .insert(this.serialize(row))
      .returning('id')

    const conversation = {
      id,
      ...row
    }
    this.cache.set(id, conversation)

    return conversation
  }

  public async getMostRecent(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation | undefined> {
    const rows = await this.query()
      .select('*')
      .where(endpoint)
      // TODO createdOn is not a good measure
      .orderBy('createdOn', 'desc')
      .limit(1)

    const conversation = this.deserialize(rows[0])
    if (conversation) {
      this.cache.set(conversation.id, conversation)
    }

    return conversation
  }

  public async getById(conversationId: number): Promise<sdk.Conversation | undefined> {
    const cached = this.cache.get(conversationId)
    if (cached) {
      return cached
    }

    const rows = await this.query()
      .select('*')
      .where({ id: conversationId })

    const conversation = this.deserialize(rows[0])
    if (conversation) {
      this.cache.set(conversationId, conversation)
    }

    return conversation
  }

  public async delete(conversationId: number): Promise<boolean> {
    const numberOfDeletedRows = await this.query()
      .where({ id: conversationId })
      .del()

    this.cache.del(conversationId)

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

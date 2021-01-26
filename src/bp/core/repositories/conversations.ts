import * as sdk from 'botpress/sdk'
import { inject, injectable } from 'inversify'

import Database from '../database'
import { TYPES } from '../types'
import LRU from 'lru-cache'
import ms from 'ms'
import { MessageRepository } from './messages'

export interface ConversationRepository {
  getAll(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation[]>
  getAllRecent(endpoint: sdk.UserEndpoint, limit?: number): Promise<sdk.RecentConversation[]>
  deleteAll(endpoint: sdk.UserEndpoint): Promise<number>
  create(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation>
  getMostRecent(endpoint: sdk.UserEndpoint): Promise<sdk.RecentConversation | undefined>
  getById(conversationId: number): Promise<sdk.Conversation | undefined>
  delete(conversationId: number): Promise<boolean>
  query()
  serialize(conversation: Partial<sdk.Conversation>)
  deserialize(conversation: any)
}

@injectable()
export class KnexConversationRepository implements ConversationRepository {
  private readonly TABLE_NAME = 'conversations'
  private cache = new LRU<number, sdk.Conversation>({ max: 10000, maxAge: ms('5min') })

  constructor(
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.MessageRepository) private messageRepo: MessageRepository
  ) {}

  public async getAll(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation[]> {
    const rows = await this.query()
      .select('*')
      .where(endpoint)

    return rows.map(x => this.deserialize(x)!)
  }

  public async getAllRecent(endpoint: sdk.UserEndpoint, limit?: number): Promise<sdk.RecentConversation[]> {
    let query = this.query()
      .select(
        'conversations.id',
        'conversations.userId',
        'conversations.botId',
        'conversations.createdOn',
        'messages.id as messageId',
        'messages.eventId',
        'messages.incomingEventId',
        'messages.from',
        'messages.payload',
        'messages.sentOn'
      )
      .leftJoin('messages', 'messages.conversationId', 'conversations.id')
      .where({
        userId: endpoint.userId,
        botId: endpoint.botId,
        sentOn: this.database.knex
          .max('sentOn')
          .from('messages')
          .where('messages.conversationId', this.database.knex.ref('conversations.id'))
      })
      .groupBy('conversations.id', 'messages.id')
      .orderBy('sentOn', 'desc')

    if (limit) {
      query = query.limit(limit)
    }

    return (await query).map(row => {
      const conversation = this.deserialize(row)!
      const message = this.messageRepo.deserialize({ ...row, id: row.messageId, conversationId: row.id })

      this.cache.set(conversation.id, conversation)

      return { ...conversation, lastMessage: message }
    })
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

  public async getMostRecent(endpoint: sdk.UserEndpoint): Promise<sdk.RecentConversation | undefined> {
    const query = this.query()
      .select(
        'conversations.id',
        'conversations.userId',
        'conversations.botId',
        'conversations.createdOn',
        'messages.id as messageId',
        'messages.eventId',
        'messages.incomingEventId',
        'messages.from',
        'messages.payload'
      )
      .max('messages.sentOn', { as: 'sentOn' })
      .leftJoin('messages', 'messages.conversationId', 'conversations.id')
      .where(endpoint)
      .groupBy('conversations.id', 'messages.id')
      .orderBy('sentOn')
      .limit(1)

    console.log(query.toSQL())
    const rows = await query
    console.log(rows)

    const conversation = this.deserialize(rows[0])
    if (conversation) {
      this.cache.set(conversation.id, conversation)

      const message = this.messageRepo.deserialize({ ...rows[0], id: rows[0].messageId, conversationId: rows[0].id })
      return { ...conversation, lastMessage: message }
    }
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

  public query() {
    return this.database.knex(this.TABLE_NAME)
  }

  public serialize(conversation: Partial<sdk.Conversation>) {
    const { userId, botId, createdOn } = conversation
    return {
      userId,
      botId,
      createdOn: createdOn?.toISOString()
    }
  }

  public deserialize(conversation: any): sdk.Conversation | undefined {
    if (!conversation) {
      return undefined
    }

    const { id, userId, botId, createdOn } = conversation
    return {
      id,
      userId,
      botId,
      createdOn: new Date(createdOn)
    }
  }
}

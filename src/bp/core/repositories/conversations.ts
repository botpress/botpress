import * as sdk from 'botpress/sdk'
import { inject, injectable, postConstruct } from 'inversify'

import Database from '../database'
import { TYPES } from '../types'
import LRU from 'lru-cache'
import ms from 'ms'
import { KnexMessageRepository, MessageRepository } from './messages'
import { JobService } from 'core/services/job-service'

export interface ConversationRepository {
  getAll(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation[]>
  getAllRecent(endpoint: sdk.UserEndpoint, limit?: number): Promise<sdk.RecentConversation[]>
  deleteAll(endpoint: sdk.UserEndpoint): Promise<number>
  create(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation>
  getMostRecent(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation | undefined>
  getById(conversationId: number): Promise<sdk.Conversation | undefined>
  delete(conversationId: number): Promise<boolean>
  query()
  serialize(conversation: Partial<sdk.Conversation>)
  deserialize(conversation: any)
  flagAsCertainlyMostRecent(conversation: sdk.Conversation)
  flagAsPossiblyNotMostRecent(conversation: sdk.Conversation)
}

@injectable()
export class KnexConversationRepository implements ConversationRepository {
  private readonly TABLE_NAME = 'conversations'
  private cache = new LRU<number, sdk.Conversation>({ max: 10000, maxAge: ms('5min') })
  private mostRecentCache = new LRU<string, sdk.Conversation>({ max: 10000, maxAge: ms('5min') })
  private messageRepo: MessageRepository
  public invalidateConvCache: Function = this._localInvalidateConvCache
  public invalidateMostRecentCache: Function = this._localInvalidateMostRecentCache

  constructor(
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.JobService) private jobService: JobService
  ) {
    this.messageRepo = new KnexMessageRepository(database)
  }

  @postConstruct()
  async init() {
    this.invalidateConvCache = await this.jobService.broadcast<void>(this._localInvalidateConvCache.bind(this))
    this.invalidateMostRecentCache = await this.jobService.broadcast<void>(
      this._localInvalidateMostRecentCache.bind(this)
    )
  }

  public async getAll(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation[]> {
    const rows = await this.query()
      .select('*')
      .where(endpoint)

    return rows.map(x => this.deserialize(x)!)
  }

  public async getAllRecent(endpoint: sdk.UserEndpoint, limit?: number): Promise<sdk.RecentConversation[]> {
    let query = this.queryRecents(endpoint)

    if (limit) {
      query = query.limit(limit)
    }

    return (await query).map(row => {
      const conversation = this.deserialize(row)!
      const message = this.messageRepo.deserialize({ ...row, id: row.messageId, conversationId: row.id })

      return { ...conversation, lastMessage: message }
    })
  }

  public async deleteAll(endpoint: sdk.UserEndpoint): Promise<number> {
    const numberOfDeletedRows = await this.query()
      .where(endpoint)
      .del()

    this.invalidateConvCache(undefined)
    this.invalidateMostRecentCache(endpoint)

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
    const cacheKey = this.getEnpointCacheKey(endpoint)
    const cached = this.mostRecentCache.get(cacheKey)
    if (cached) {
      return cached
    }

    let query = this.queryRecents(endpoint)
    query = query.limit(1)
    const rows = await query

    const conversation = this.deserialize(rows[0])
    if (conversation) {
      this.mostRecentCache.set(cacheKey, conversation)
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
    const conversation = this.getById(conversationId)

    const numberOfDeletedRows = await this.query()
      .where({ id: conversationId })
      .del()

    this.invalidateConvCache(conversationId)
    this.invalidateMostRecentCache(conversation)

    return numberOfDeletedRows > 0
  }

  private queryRecents(endpoint: sdk.UserEndpoint) {
    return this.query()
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

  public async flagAsCertainlyMostRecent(conversation: sdk.Conversation) {
    const key = this.getEnpointCacheKey(conversation)
    const currentMostRecent = this.mostRecentCache.peek(key)
    if (currentMostRecent?.id !== conversation.id) {
      this.invalidateMostRecentCache(conversation)
      this.mostRecentCache.set(key, conversation)
    }
  }

  public async flagAsPossiblyNotMostRecent(conversation: sdk.Conversation) {
    const key = this.getEnpointCacheKey(conversation)
    const currentMostRecent = this.mostRecentCache.peek(key)
    if (currentMostRecent?.id === conversation.id) {
      this.invalidateMostRecentCache(conversation)
    }
  }

  private getEnpointCacheKey(endpoint: sdk.UserEndpoint) {
    return `${endpoint.botId}_${endpoint.userId}`
  }

  private _localInvalidateConvCache(id: number) {
    if (id) {
      this.cache.del(id)
    } else {
      this.cache.reset()
    }
  }
  private _localInvalidateMostRecentCache(endpoint: sdk.UserEndpoint) {
    this.mostRecentCache.del(this.getEnpointCacheKey(endpoint))
  }
}

import * as sdk from 'botpress/sdk'
import { JobService } from 'core/services/job-service'
import { inject, injectable, postConstruct } from 'inversify'

import LRU from 'lru-cache'
import ms from 'ms'
import Database from '../database'
import { TYPES } from '../types'
import { MessageRepository } from './messages'

export interface ConversationRepository {
  getAll(endpoint: sdk.experimental.UserEndpoint): Promise<sdk.experimental.Conversation[]>
  getAllRecent(endpoint: sdk.experimental.UserEndpoint, limit?: number): Promise<sdk.experimental.RecentConversation[]>
  deleteAll(endpoint: sdk.experimental.UserEndpoint): Promise<number>
  create(endpoint: sdk.experimental.UserEndpoint): Promise<sdk.experimental.Conversation>
  getMostRecent(endpoint: sdk.experimental.UserEndpoint): Promise<sdk.experimental.Conversation | undefined>
  getById(conversationId: number): Promise<sdk.experimental.Conversation | undefined>
  delete(conversationId: number): Promise<boolean>
  query()
  serialize(conversation: Partial<sdk.experimental.Conversation>)
  deserialize(conversation: any)
}

@injectable()
export class KnexConversationRepository implements ConversationRepository {
  private readonly TABLE_NAME = 'conversations'
  private cache = new LRU<number, sdk.experimental.Conversation>({ max: 10000, maxAge: ms('5min') })
  private invalidateConvCache: (ids: number[]) => void = this._localInvalidateConvCache

  constructor(
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.JobService) private jobService: JobService,
    @inject(TYPES.MessageRepository) private messageRepo: MessageRepository
  ) {}

  @postConstruct()
  async init() {
    this.invalidateConvCache = <any>await this.jobService.broadcast<void>(this._localInvalidateConvCache.bind(this))
  }

  public async getAll(endpoint: sdk.experimental.UserEndpoint): Promise<sdk.experimental.Conversation[]> {
    const rows = await this.query()
      .select('*')
      .where(endpoint)

    return rows.map(x => this.deserialize(x)!)
  }

  public async getAllRecent(
    endpoint: sdk.experimental.UserEndpoint,
    limit?: number
  ): Promise<sdk.experimental.RecentConversation[]> {
    let query = this.queryRecents(endpoint)

    if (limit) {
      query = query.limit(limit)
    }

    return (await query).map(row => {
      const conversation = this.deserialize(row)!
      const message = row.messageId
        ? this.messageRepo.deserialize({ ...row, id: row.messageId, conversationId: row.id })
        : undefined

      return { ...conversation, lastMessage: message }
    })
  }

  public async deleteAll(endpoint: sdk.experimental.UserEndpoint): Promise<number> {
    const deletedIds = (
      await this.query()
        .select('id')
        .where(endpoint)
    ).map(x => x.id)

    if (deletedIds.length) {
      await this.query()
        .where(endpoint)
        .del()

      this.invalidateConvCache(deletedIds)
    }

    return deletedIds.length
  }

  public async create(endpoint: sdk.experimental.UserEndpoint): Promise<sdk.experimental.Conversation> {
    const row = {
      userId: endpoint.userId,
      botId: endpoint.botId,
      createdOn: new Date()
    }

    const id = await this.database.knex.insertAndGetId(this.TABLE_NAME, this.serialize(row))
    const conversation = {
      id,
      ...row
    }
    this.cache.set(id, conversation)

    return conversation
  }

  public async getMostRecent(
    endpoint: sdk.experimental.UserEndpoint
  ): Promise<sdk.experimental.Conversation | undefined> {
    let query = this.queryRecents(endpoint)
    query = query.limit(1)

    return this.deserialize((await query)[0])
  }

  public async getById(conversationId: number): Promise<sdk.experimental.Conversation | undefined> {
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

    this.invalidateConvCache([conversationId])

    return numberOfDeletedRows > 0
  }

  private queryRecents(endpoint: sdk.experimental.UserEndpoint) {
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
        botId: endpoint.botId
      })
      .andWhere(builder => {
        void builder
          .where({
            sentOn: this.database.knex
              .max('sentOn')
              .from('messages')
              .where('messages.conversationId', this.database.knex.ref('conversations.id'))
          })
          .orWhereNull('sentOn')
      })
      .groupBy('conversations.id', 'messages.id')
      .orderBy('sentOn', 'desc')
  }

  public query() {
    return this.database.knex(this.TABLE_NAME)
  }

  public serialize(conversation: Partial<sdk.experimental.Conversation>) {
    const { userId, botId, createdOn } = conversation
    return {
      userId,
      botId,
      createdOn: this.database.knex.date.set(createdOn)
    }
  }

  public deserialize(conversation: any): sdk.experimental.Conversation | undefined {
    if (!conversation) {
      return undefined
    }

    const { id, userId, botId, createdOn } = conversation
    return {
      id,
      userId,
      botId,
      createdOn: this.database.knex.date.get(createdOn)
    }
  }

  private _localInvalidateConvCache(ids: number[]) {
    ids?.forEach(id => this.cache.del(id))
  }
}

import { experimental } from 'botpress/sdk'
import { JobService } from 'core/services/job-service'
import { inject, injectable, postConstruct } from 'inversify'

import LRU from 'lru-cache'
import ms from 'ms'
import Database from '../database'
import { TYPES } from '../types'
import { MessageRepository } from './messages'

export interface ConversationRepository {
  list(botId: string, userId: string, limit?: number, offset?: number): Promise<experimental.RecentConversation[]>
  deleteAll(botId: string, userId: string): Promise<number>
  create(botId: string, args: experimental.conversations.CreateArgs): Promise<experimental.Conversation>
  recent(botId: string, userId: string): Promise<experimental.Conversation | undefined>
  get(conversationId: number): Promise<experimental.Conversation | undefined>
  delete(conversationId: number): Promise<boolean>
}

@injectable()
export class KnexConversationRepository implements ConversationRepository {
  private readonly TABLE_NAME = 'conversations'
  private cache = new LRU<number, experimental.Conversation>({ max: 10000, maxAge: ms('5min') })
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

  public async list(
    botId: string,
    userId: string,
    limit?: number,
    offset?: number
  ): Promise<experimental.RecentConversation[]> {
    let query = this.queryRecents(botId, userId)

    if (limit) {
      query = query.limit(limit)
    }

    if (offset) {
      query = query.offset(offset)
    }

    return (await query).map(row => {
      const conversation = this.deserialize(row)!
      const message = row.messageId
        ? this.messageRepo.deserialize({ ...row, id: row.messageId, conversationId: row.id })
        : undefined

      return { ...conversation, lastMessage: message }
    })
  }

  public async deleteAll(botId: string, userId: string): Promise<number> {
    const deletedIds = (
      await this.query()
        .select('id')
        .where({ botId, userId })
    ).map(x => x.id)

    if (deletedIds.length) {
      await this.query()
        .where({ botId, userId })
        .del()

      this.invalidateConvCache(deletedIds)
    }

    return deletedIds.length
  }

  public async create(botId: string, args: experimental.conversations.CreateArgs): Promise<experimental.Conversation> {
    const row = {
      userId: args.userId,
      botId,
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

  public async recent(botId: string, userId: string): Promise<experimental.Conversation | undefined> {
    let query = this.queryRecents(botId, userId)
    query = query.limit(1)

    return this.deserialize((await query)[0])
  }

  public async get(conversationId: number): Promise<experimental.Conversation | undefined> {
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

  private queryRecents(botId: string, userId: string) {
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
        botId,
        userId
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

  private query() {
    return this.database.knex(this.TABLE_NAME)
  }

  public serialize(conversation: Partial<experimental.Conversation>) {
    const { userId, botId, createdOn } = conversation
    return {
      userId,
      botId,
      createdOn: this.database.knex.date.set(createdOn)
    }
  }

  public deserialize(conversation: any): experimental.Conversation | undefined {
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

import sdk from 'botpress/sdk'
import { TYPES } from 'core/app/types'
import Database from 'core/database'
import { JobService } from 'core/distributed'
import { inject, injectable, postConstruct } from 'inversify'

import LRU from 'lru-cache'
import ms from 'ms'
import uuid from 'uuid'

import { MessageRepository } from './message-repository'

@injectable()
export class ConversationRepository {
  private readonly TABLE_NAME = 'conversations'
  private cache = new LRU<sdk.uuid, sdk.Conversation>({ max: 10000, maxAge: ms('5min') })
  private invalidateConvCache: (ids: sdk.uuid[]) => void = this._localInvalidateConvCache

  constructor(
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.JobService) private jobService: JobService,
    @inject(TYPES.MessageRepository) private messageRepo: MessageRepository
  ) {}
  @postConstruct()
  async init() {
    this.invalidateConvCache = <any>await this.jobService.broadcast<void>(this._localInvalidateConvCache.bind(this))
  }

  public async list(botId: string, filters: sdk.ConversationListFilters): Promise<sdk.RecentConversation[]> {
    const { userId, limit, offset } = filters

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

  public async create(botId: string, userId: sdk.uuid): Promise<sdk.Conversation> {
    const conversation = {
      id: uuid.v4(),
      userId,
      botId,
      createdOn: new Date()
    }

    await this.query().insert(this.serialize(conversation))
    this.cache.set(conversation.id, conversation)

    return conversation
  }

  public async recent(botId: string, userId: string): Promise<sdk.Conversation | undefined> {
    let query = this.queryRecents(botId, userId)
    query = query.limit(1)

    return this.deserialize((await query)[0])
  }

  public async get(conversationId: sdk.uuid): Promise<sdk.Conversation | undefined> {
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

  public async delete(conversationId: sdk.uuid): Promise<boolean> {
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

  public serialize(conversation: Partial<sdk.Conversation>) {
    const { id, userId, botId, createdOn } = conversation
    return {
      id,
      userId,
      botId,
      createdOn: this.database.knex.date.set(createdOn)
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
      createdOn: this.database.knex.date.get(createdOn)
    }
  }

  private _localInvalidateConvCache(ids: sdk.uuid[]) {
    ids?.forEach(id => this.cache.del(id))
  }
}

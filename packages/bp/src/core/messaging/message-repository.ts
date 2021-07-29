import sdk from 'botpress/sdk'
import Database from 'core/database'
import { JobService } from 'core/distributed'
import { TYPES } from 'core/types'
import { inject, injectable, postConstruct } from 'inversify'
import LRU from 'lru-cache'
import ms from 'ms'
import uuid from 'uuid'

@injectable()
export class MessageRepository {
  private readonly TABLE_NAME = 'messages'
  private cache = new LRU<sdk.uuid, sdk.Message>({ max: 10000, maxAge: ms('5min') })
  private invalidateMsgCache: (ids: sdk.uuid[]) => void = this._localInvalidateMsgCache

  constructor(
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.JobService) private jobService: JobService
  ) {}

  @postConstruct()
  async init() {
    this.invalidateMsgCache = <any>await this.jobService.broadcast<void>(this._localInvalidateMsgCache.bind(this))
  }

  public async list(filters: sdk.MessageListFilters): Promise<sdk.Message[]> {
    const { conversationId, limit, offset } = filters

    let query = this.query()
      .where({ conversationId })
      .orderBy('sentOn', 'desc')

    if (limit) {
      query = query.limit(limit)
    }

    if (offset) {
      query = query.offset(offset)
    }

    return (await query).map(x => this.deserialize(x)!)
  }

  public async deleteAll(conversationId: sdk.uuid): Promise<number> {
    const deletedIds = (
      await this.query()
        .select('id')
        .where({ conversationId })
    ).map(x => x.id)

    if (deletedIds.length) {
      await this.query()
        .where({ conversationId })
        .del()

      this.invalidateMsgCache(deletedIds)
    }

    return deletedIds.length
  }

  public async create(
    conversationId: sdk.uuid,
    payload: any,
    authorId: string | undefined,
    eventId?: string,
    incomingEventId?: string
  ): Promise<sdk.Message> {
    const message = {
      id: uuid.v4(),
      conversationId,
      authorId,
      eventId,
      incomingEventId,
      sentOn: new Date(),
      payload
    }

    await this.query().insert(this.serialize(message))
    this.cache.set(message.id, message)

    return message
  }

  public async get(messageId: sdk.uuid): Promise<sdk.Message | undefined> {
    const cached = this.cache.get(messageId)
    if (cached) {
      return cached
    }

    const rows = await this.query()
      .select('*')
      .where({ id: messageId })

    const message = this.deserialize(rows[0])
    if (message) {
      this.cache.set(messageId, message)
    }

    return message
  }

  public async delete(messageId: sdk.uuid): Promise<boolean> {
    const numberOfDeletedRows = await this.query()
      .where({ id: messageId })
      .del()

    this.invalidateMsgCache([messageId])

    return numberOfDeletedRows > 0
  }

  private query() {
    return this.database.knex(this.TABLE_NAME)
  }

  public serialize(message: Partial<sdk.Message>) {
    const { id, conversationId, authorId, eventId, incomingEventId, sentOn, payload } = message
    return {
      id,
      conversationId,
      authorId,
      eventId,
      incomingEventId,
      sentOn: this.database.knex.date.set(sentOn),
      payload: this.database.knex.json.set(payload)
    }
  }

  public deserialize(message: any): sdk.Message | undefined {
    if (!message) {
      return undefined
    }

    const { id, conversationId, authorId, eventId, incomingEventId, sentOn, payload } = message
    return {
      id,
      conversationId,
      authorId,
      eventId,
      incomingEventId,
      sentOn: this.database.knex.date.get(sentOn),
      payload: this.database.knex.json.get(payload)
    }
  }

  private _localInvalidateMsgCache(ids: sdk.uuid[]) {
    ids?.forEach(id => this.cache.del(id))
  }
}

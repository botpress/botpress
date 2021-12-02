import { Paging, User } from 'botpress/sdk'
import { TYPES } from 'core/app/types'
import Database from 'core/database'
import { JobService } from 'core/distributed'
import { inject, injectable, postConstruct } from 'inversify'
import Knex from 'knex'
import _ from 'lodash'
import LRU from 'lru-cache'
import ms from 'ms'

import { DataRetentionService } from '../data-retention/data-retention-service'

interface Row {
  channel: string
  botId: string
  userId: string
}

@injectable()
export class ChannelUserRepository {
  private readonly tableName = 'srv_channel_users'
  private readonly botUsersTableName = 'bot_chat_users'

  private batches: Dic<Row> = {}
  private flushLock: boolean = false
  private userCache = new LRU({ max: 10000, maxAge: ms('1h') })
  private broadcastDeleteUserCache!: Function
  private readonly flushInterval = ms('10s')

  constructor(
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.DataRetentionService) private dataRetentionService: DataRetentionService,
    @inject(TYPES.JobService) private jobService: JobService
  ) {
    setInterval(() => this.flushUsers(), this.flushInterval)
  }

  @postConstruct()
  async init() {
    this.broadcastDeleteUserCache = await this.jobService.broadcast<void>(this._deleteUserCache.bind(this))
  }

  private async _deleteUserCache(key: string): Promise<boolean> {
    this.userCache.del(key)
    return true
  }

  async flushUsers() {
    if (this.flushLock || !this.database?.knex) {
      return
    }

    this.flushLock = true
    try {
      // we batch maximum 1000 rows in the same query
      const original = this.batches
      const keys = _.take(Object.keys(this.batches), 1000)
      if (!keys.length) {
        return
      }
      this.batches = _.omit(this.batches, keys)
      // build a master query
      const today = this.database.knex.date.today().toQuery()
      const values = keys.map(k => this.database.knex.raw('(:botId, :channel, :userId)', original[k] as any)).join(',')
      const query = this.database.knex
        .raw(
          // careful if changing this query, make sure it works in both SQLite and Postgres
          `insert into ${this.botUsersTableName}
("botId", channel, "userId") values ${values}
  on conflict("userId", "botId", channel)
  do update set "lastSeenOn" = ${today}`
        )
        .toQuery()

      await this.database.knex
        .transaction(async trx => {
          await trx.raw(query)
        })
        .catch(_err => {
          // we restore rows we couldn't insert
          this.batches = _.merge(original, this.batches)
        })
    } finally {
      // release the lock
      this.flushLock = false
    }
  }

  private getCacheKey(channel: string, userId: string): string {
    return `${channel}_${userId}`
  }

  async getOrCreate(channel: string, id: string, botId?: string): Knex.GetOrCreateResult<User> {
    channel = channel.toLowerCase()
    const cacheKey = this.getCacheKey(channel, id)

    if (this.userCache.has(cacheKey)) {
      return { result: <User>this.userCache.get(cacheKey), created: false }
    }

    const ug = await this.database
      .knex(this.tableName)
      .where({
        channel,
        user_id: id
      })
      .limit(1)
      .select('attributes', 'created_at', 'updated_at')
      .first()

    if (botId) {
      // we do only one query per user/channel/botId per flush
      const key = `${id}_${botId}_${channel}`
      this.batches[key] = { userId: id, channel, botId }
    }

    if (ug) {
      const user: User = {
        channel,
        id,
        createdOn: ug.created_at,
        updatedOn: ug.updated_at,
        attributes: this.database.knex.json.get(ug.attributes),
        otherChannels: []
      }

      this.userCache.set(cacheKey, user)
      return { result: user, created: false }
    }

    const newUser = await this.database.knex
      .insertAndRetrieve<User>(
        this.tableName,
        {
          channel,
          user_id: id,
          attributes: this.database.knex.json.set({})
        },
        ['attributes', 'channel', 'created_at', 'updated_at']
      )
      .then(res => {
        return {
          id: res.id,
          attributes: this.database.knex.json.get(res.attributes),
          channel: res.channel,
          createdOn: res['created_at'],
          updatedOn: res['updated_at']
        }
      })

    this.userCache.set(cacheKey, newUser)
    return { result: newUser, created: true }
  }

  async getAttributes(channel: string, user_id: string): Promise<any> {
    const user = await this.database
      .knex(this.tableName)
      .where({ channel, user_id })
      .limit(1)
      .select('attributes')
      .first()

    return this.database.knex.json.get(user.attributes)
  }

  async setAttributes(channel: string, user_id: string, attributes: any, trx?: Knex.Transaction): Promise<void> {
    channel = channel.toLowerCase()
    await this._dataRetentionUpdate(channel, user_id, attributes)

    const originalAttributes = await this.getAttributes(channel, user_id)
    if (_.isEqual(originalAttributes, attributes)) {
      return
    }

    const req = this.database
      .knex(this.tableName)
      .update({ attributes: this.database.knex.json.set(attributes) })
      .where({ channel, user_id })

    if (trx) {
      await req.transacting(trx)
    }

    await req

    await this.broadcastDeleteUserCache(this.getCacheKey(channel, user_id))
  }

  async updateAttributes(channel: string, user_id: string, attributes: any): Promise<void> {
    channel = channel.toLowerCase()
    await this._dataRetentionUpdate(channel, user_id, attributes)

    const originalAttributes = await this.getAttributes(channel, user_id)

    await this.database
      .knex(this.tableName)
      .update({ attributes: this.database.knex.json.set({ ...originalAttributes, ...attributes }) })
      .where({ channel, user_id })

    await this.broadcastDeleteUserCache(this.getCacheKey(channel, user_id))
  }

  private async _dataRetentionUpdate(channel: string, user_id: string, attributes: any) {
    if (this.dataRetentionService.hasPolicy()) {
      const originalAttributes = await this.getAttributes(channel, user_id)
      await this.dataRetentionService.updateExpirationForChangedFields(channel, user_id, originalAttributes, attributes)
    }
  }

  async getAllUsers(paging?: Paging) {
    let query = this.database
      .knex(this.tableName)
      .select('*')
      .orderBy('created_at', 'asc')

    if (paging) {
      query = query.offset(paging.start).limit(paging.count)
    }

    const users = await query

    return users.map(user => ({
      ...user,
      attributes: this.database.knex.json.get(user.attributes)
    }))
  }

  async getUserCount() {
    const result = await this.database
      .knex<User>(this.tableName)
      .count<Record<string, number>>('user_id as qty')
      .first()
      .then(result => result!.qty)

    // depending on the DB type (sqlite, postgres), the returned type can be string or int. We force int.
    // @ts-ignore
    return parseInt(result)
  }
}

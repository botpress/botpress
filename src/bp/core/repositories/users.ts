import { Paging, User } from 'botpress/sdk'
import { DataRetentionService } from 'core/services/retention/service'
import { inject, injectable } from 'inversify'
import Knex from 'knex'
import _ from 'lodash'
import ms from 'ms'

import Database from '../database'
import { TYPES } from '../types'
export interface UserRepository {
  getOrCreate(channel: string, id: string, botId?: string): Knex.GetOrCreateResult<User>
  updateAttributes(channel: string, id: string, attributes: any): Promise<void>
  setAttributes(channel: string, id: string, attributes: any, trx?: Knex.Transaction): Promise<void>
  getAttributes(channel: string, id: string): Promise<any>
  getAllUsers(paging?: Paging): Promise<any>
  getUserCount(): Promise<any>
}

type Row = { channel: string; botId: string; userId: string }

@injectable()
export class KnexUserRepository implements UserRepository {
  private readonly tableName = 'srv_channel_users'
  private readonly botUsersTableName = 'bot_chat_users'

  private batches: Dic<Row> = {}
  private flushLock: boolean = false
  private readonly flushInterval = ms('10s')

  constructor(
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.DataRetentionService) private dataRetentionService: DataRetentionService
  ) {
    setInterval(() => this.flushUsers(), this.flushInterval)
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
      const values = keys.map(k => this.database.knex.raw(`(:botId, :channel, :userId)`, original[k])).join(',')
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

  async getOrCreate(channel: string, id: string, botId?: string): Knex.GetOrCreateResult<User> {
    channel = channel.toLowerCase()

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
        id: id,
        createdOn: ug.created_at,
        updatedOn: ug.updated_at,
        attributes: this.database.knex.json.get(ug.attributes),
        otherChannels: []
      }

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
          attributes: res.attributes,
          channel: res.channel,
          createdOn: res['created_at'],
          updatedOn: res['updated_at']
        }
      })

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

    const req = this.database
      .knex(this.tableName)
      .update({ attributes: this.database.knex.json.set(attributes) })
      .where({ channel, user_id })

    if (trx) {
      req.transacting(trx)
    }

    await req
  }

  async updateAttributes(channel: string, user_id: string, attributes: any): Promise<void> {
    channel = channel.toLowerCase()
    await this._dataRetentionUpdate(channel, user_id, attributes)

    const originalAttributes = await this.getAttributes(channel, user_id)

    await this.database
      .knex(this.tableName)
      .update({ attributes: this.database.knex.json.set({ ...originalAttributes, ...attributes }) })
      .where({ channel, user_id })
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

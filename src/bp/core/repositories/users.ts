import { AnalyticsMethod, AnalyticsMetric, Paging, User } from 'botpress/sdk'
import AnalyticsService from 'core/services/analytics-service'
import { DataRetentionService } from 'core/services/retention/service'
import { inject, injectable } from 'inversify'
import Knex from 'knex'

import Database from '../database'
import { TYPES } from '../types'

export interface UserRepository {
  getOrCreate(channel: string, id: string, botId?: string): Knex.GetOrCreateResult<User>
  get(channel: string, id: string): Promise<User>
  updateAttributes(channel: string, id: string, attributes: any): Promise<void>
  setAttributes(channel: string, id: string, attributes: any, trx?: Knex.Transaction): Promise<void>
  getAttributes(channel: string, id: string): Promise<any>
  getAllUsers(paging?: Paging): Promise<any>
  getUserCount(opt?: { channel?: string; botId?: string }): Promise<any>
}

@injectable()
export class KnexUserRepository implements UserRepository {
  private readonly tableName = 'srv_channel_users'

  constructor(
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.DataRetentionService) private dataRetentionService: DataRetentionService,
    @inject(TYPES.AnalyticsService) private analytics: AnalyticsService
  ) {}

  async getOrCreate(channel: string, id: string, botId: string): Knex.GetOrCreateResult<User> {
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
          botId,
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

    this.analytics.addMetric({
      botId,
      channel,
      metric: AnalyticsMetric.NewUsersCount,
      method: AnalyticsMethod.DailyCount
    })
    this.analytics.addMetric({ botId, channel, metric: AnalyticsMetric.UsersTotal, method: AnalyticsMethod.TotalCount })

    return { result: newUser, created: true }
  }

  async get(channel: string, id: string): Promise<User> {
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

    if (ug) {
      const user: User = {
        channel,
        id: id,
        createdOn: ug.created_at,
        updatedOn: ug.updated_at,
        attributes: this.database.knex.json.get(ug.attributes),
        otherChannels: []
      }

      return user
    } else {
      throw new Error(`User id ${id} not found.`)
    }
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

  async getUserCount(opt?: { channel?: string; botId?: string }) {
    let query = this.database.knex<User>(this.tableName).count<Record<string, number>>('user_id as qty')

    if (opt?.channel) {
      query = query.andWhere({ channel: opt.channel })
    }
    if (opt?.botId) {
      query = query.andWhere({ botId: opt.botId })
    }

    const result = await query.first().then(result => result!.qty)

    // depending on the DB type (sqlite, postgres), the returned type can be string or int. We force int.
    // @ts-ignore
    return parseInt(result)
  }
}

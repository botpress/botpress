import { Pagination, User, UserAttribute, UserAttributeMap } from 'botpress/sdk'
import { inject, injectable } from 'inversify'
import Knex from 'knex'

import Database from '../database'
import { TYPES } from '../types'

export interface UserRepository {
  getOrCreate(channel: string, id: string): Knex.GetOrCreateResult<User>
  updateAttributes(channel: string, id: string, attributes: UserAttribute[]): Promise<void>
  getAllUsers(pagination?: Pagination): Promise<any>
  getUserCount(): Promise<any>
}

function channelUserAttributes(arr: UserAttribute[] = []): UserAttributeMap {
  ;(arr as UserAttributeMap).get = (key: string): string | undefined => {
    const match = arr.find(x => x.key.toLowerCase() === key.toLowerCase())
    return (match && match.value) || undefined
  }

  return arr as UserAttributeMap
}

@injectable()
export class KnexUserRepository implements UserRepository {
  private readonly tableName = 'srv_channel_users'

  constructor(@inject(TYPES.Database) private database: Database) {}

  async getOrCreate(channel: string, id: string): Knex.GetOrCreateResult<User> {
    channel = channel.toLowerCase()

    const ug = await this.database
      .knex(this.tableName)
      .where({
        channel,
        user_id: id
      })
      .limit(1)
      .select('attributes', 'created_at', 'updated_at')

    if (ug) {
      const user: User = {
        channel: ug.channel,
        id: ug.user_id,
        createdOn: ug.created_at,
        updatedOn: ug.updated_at,
        attributes: channelUserAttributes(this.database.knex.json.get(ug.attributes)),
        otherChannels: []
      }

      return { result: user, created: false }
    }

    await this.database.knex(this.tableName).insert({
      channel,
      user_id: id,
      attributes: this.database.knex.json.set([])
    })

    const newUser: User = {
      attributes: channelUserAttributes([]),
      channel: channel,
      id,
      createdOn: new Date(),
      updatedOn: new Date(),
      otherChannels: []
    }

    return { result: newUser, created: true }
  }

  async updateAttributes(channel: string, id: string, attributes: UserAttribute[]): Promise<void> {
    channel = channel.toLowerCase()

    if (!attributes || attributes.length === undefined) {
      throw new Error('Attributes must be an array of ChannelUserAttribute')
    }

    await this.database
      .knex(this.tableName)
      .update({
        attributes: this.database.knex.json.set(attributes)
      })
      .where({ channel, user_id: id })
  }

  async getAllUsers(pagination?: Pagination) {
    let query = this.database
      .knex(this.tableName)
      .select('*')
      .orderBy('created_at', 'asc')

    if (pagination) {
      query = query.offset(pagination.start).limit(pagination.count)
    }

    return await query
  }

  async getUserCount() {
    return await this.database
      .knex(this.tableName)
      .count('user_id as qty')
      .then(res => {
        if (res && res.length > 0) {
          return res[0].qty
        } else {
          return 0
        }
      })
  }
}

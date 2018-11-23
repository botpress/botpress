import { Paging, User } from 'botpress/sdk'
import { inject, injectable } from 'inversify'
import Knex from 'knex'

import Database from '../database'
import { TYPES } from '../types'

export interface UserRepository {
  getOrCreate(channel: string, id: string): Knex.GetOrCreateResult<User>
  updateAttributes(channel: string, id: string, attributes: any): Promise<void>
  getAllUsers(paging?: Paging): Promise<any>
  getUserCount(): Promise<any>
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

    await this.database.knex(this.tableName).insert({
      channel,
      user_id: id,
      attributes: this.database.knex.json.set({})
    })

    const newUser: User = {
      attributes: {},
      channel: channel,
      id,
      createdOn: new Date(),
      updatedOn: new Date(),
      otherChannels: []
    }

    return { result: newUser, created: true }
  }

  async updateAttributes(channel: string, id: string, attributes: any): Promise<void> {
    channel = channel.toLowerCase()

    await this.database
      .knex(this.tableName)
      .update({
        attributes: this.database.knex.json.set(attributes)
      })
      .where({ channel, user_id: id })
  }

  async getAllUsers(paging?: Paging) {
    let query = this.database
      .knex(this.tableName)
      .select('*')
      .orderBy('created_at', 'asc')

    if (paging) {
      query = query.offset(paging.start).limit(paging.count)
    }

    return await query
  }

  async getUserCount() {
    return await this.database
      .knex(this.tableName)
      .count('user_id as qty')
      .first()
      .then(result => result.qty)
  }
}

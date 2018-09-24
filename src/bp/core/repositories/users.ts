import { inject, injectable } from 'inversify'
import Knex from 'knex'

import Database from '../database'
import { TYPES } from '../types'
import { AttributeMap, Attribute, User } from 'common/users'

export interface UserRepository {
  getOrCreate(channel: string, id: string): Knex.GetOrCreateResult<User>
  updateAttributes(channel: string, id: string, attributes: Attribute[]): Promise<void>
}

function channelUserAttributes(arr: Attribute[] = []): AttributeMap {
  ;(arr as AttributeMap).get = (key: string): string | undefined => {
    const match = arr.find(x => x.key.toLowerCase() === key.toLowerCase())
    return (match && match.value) || undefined
  }

  return arr as AttributeMap
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

  async updateAttributes(channel: string, id: string, attributes: Attribute[]): Promise<void> {
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
}

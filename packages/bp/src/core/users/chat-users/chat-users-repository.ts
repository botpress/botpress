import { Paging, User } from 'botpress/sdk'
import { TYPES } from 'core/app/types'
import Database from 'core/database'
import { JobService } from 'core/distributed'
import { inject, injectable, postConstruct } from 'inversify'
import Knex from 'knex'
import _ from 'lodash'
import LRU from 'lru-cache'
import ms from 'ms'

interface Row {
  channel: string
  botId: string
  userId: string
}

@injectable()
export class ChannelUserRepository {
  private readonly tableName = 'srv_channel_users'

  constructor(@inject(TYPES.Database) private database: Database) {}

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

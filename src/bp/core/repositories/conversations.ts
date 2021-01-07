import * as sdk from 'botpress/sdk'
import { inject, injectable } from 'inversify'

import Database from '../database'
import { TYPES } from '../types'

export interface ConversationRepository {
  create(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation>
  getAll(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation[]>
  getMostRecent(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation>
}

@injectable()
export class KnexConversationRepository implements ConversationRepository {
  private readonly TABLE_NAME = 'conversations'

  constructor(@inject(TYPES.Database) private database: Database) {}

  public async create(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation> {
    const row = {
      userId: endpoint.userId,
      botId: endpoint.botId,
      createdOn: new Date().toISOString()
    }

    const result = await this.query().insert(row)
    const id = result[0]

    return <any>{
      id,
      ...row
    }
  }

  public async getAll(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation[]> {
    const rows = await this.query()
      .select('*')
      .where({ userId: endpoint.userId, botId: endpoint.botId })

    return rows
  }

  public async getMostRecent(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation> {
    const rows = await this.query()
      .select('*')
      .where({ userId: endpoint.userId, botId: endpoint.botId })
      // TODO createdOn is not a good measure
      .orderBy('createdOn', 'desc')
      .limit(1)

    console.log('getMostRecent ->', rows)

    return rows[0]
  }

  private query() {
    return this.database.knex(this.TABLE_NAME)
  }
}

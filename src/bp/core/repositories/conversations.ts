import * as sdk from 'botpress/sdk'
import { inject, injectable } from 'inversify'

import Database from '../database'
import { TYPES } from '../types'

export interface ConversationRepository {
  create(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation>
  getById(conversationId: number): Promise<sdk.Conversation | undefined>
  getAll(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation[]>
  getMostRecent(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation | undefined>
}

@injectable()
export class KnexConversationRepository implements ConversationRepository {
  private readonly TABLE_NAME = 'conversations'

  constructor(@inject(TYPES.Database) private database: Database) {}

  public async create(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation> {
    const conversation = {
      userId: endpoint.userId,
      botId: endpoint.botId,
      createdOn: new Date()
    }

    const result = await this.query().insert(this.serialize(conversation))
    const id = result[0]

    return {
      id,
      ...conversation
    }
  }

  public async getById(conversationId: number): Promise<sdk.Conversation | undefined> {
    const rows = await this.query()
      .select('*')
      .where({ id: conversationId })

    return this.deserialize(rows[0])
  }

  public async getAll(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation[]> {
    const rows = await this.query()
      .select('*')
      .where({ userId: endpoint.userId, botId: endpoint.botId })

    return rows.map(x => <sdk.Conversation>this.deserialize(x))
  }

  public async getMostRecent(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation | undefined> {
    const rows = await this.query()
      .select('*')
      .where({ userId: endpoint.userId, botId: endpoint.botId })
      // TODO createdOn is not a good measure
      .orderBy('createdOn', 'desc')
      .limit(1)

    return this.deserialize(rows[0])
  }

  private query() {
    return this.database.knex(this.TABLE_NAME)
  }

  private serialize(conversation: Partial<sdk.Conversation>) {
    return {
      ...conversation,
      createdOn: conversation.createdOn?.toISOString()
    }
  }

  private deserialize(conversation: any): sdk.Conversation | undefined {
    if (!conversation) {
      return undefined
    }

    return {
      ...conversation,
      createdOn: new Date(conversation.createdOn)
    }
  }
}

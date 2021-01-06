import { inject, injectable, tagged } from 'inversify'
import * as sdk from 'botpress/sdk'
import { TYPES } from '../../types'
import Database from 'core/database'
import { MessagingDB } from './messaging-db'

@injectable()
export class MessagingAPI {
  private db: MessagingDB

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'MessagingAPI')
    private logger: sdk.Logger,
    @inject(TYPES.Database) db: Database
  ) {
    this.db = new MessagingDB(db.knex)
  }

  public async createConversation(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation> {
    const conversation: sdk.Conversation = {
      id: '',
      endpoint: endpoint
    }

    await this.db.addConversation(conversation);

    return conversation;
  }
  public async getConversation(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation> {
    // TODO
    this.logger.info("getConversation called!")
    return {
      id: '',
      endpoint: endpoint
    }
  }
  public async deleteConversation(endpoint: sdk.UserEndpoint): Promise<boolean> {
    // TODO
    this.logger.info("deleteConversation called!")
    return false
  }

  public async sendMessage(conversation: sdk.Conversation, payload: sdk.MessagePayload): Promise<sdk.Message> {
    // TODO
    this.logger.info("sendMessage called!")
    return {
      id: '',
      channel: '',
      conversation
    }
  }
  public async getAllMessages(conversation: sdk.Conversation): Promise<sdk.Message[]> {
    // TODO
    this.logger.info("getAllMessages called!")
    return []
  }
}
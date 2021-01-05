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

  public createConversation(endpoint: sdk.UserEndpoint): sdk.Conversation {
    const conversation: sdk.Conversation = {
      id: '',
      endpoint: endpoint
    }

    this.db.addConversation(conversation);

    return conversation;
  }
  public getConversation(endpoint: sdk.UserEndpoint): sdk.Conversation {
    // TODO
    this.logger.info("getConversation called!")
    return {
      id: '',
      endpoint: endpoint
    }
  }
  public deleteConversation(endpoint: sdk.UserEndpoint): boolean {
    // TODO
    this.logger.info("deleteConversation called!")
    return false
  }

  public sendMessage(conversation: sdk.Conversation, payload: sdk.MessagePayload): sdk.Message {
    // TODO
    this.logger.info("sendMessage called!")
    return {
      id: '',
      channel: '',
      conversation
    }
  }
  public getAllMessages(conversation: sdk.Conversation): sdk.Message[] {
    // TODO
    this.logger.info("getAllMessages called!")
    return []
  }
}
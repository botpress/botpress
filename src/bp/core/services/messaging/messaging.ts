import { inject, injectable } from 'inversify'
import * as sdk from 'botpress/sdk'
import { TYPES } from '../../types'
import { MessageRepository } from 'core/repositories/messages'
import { ConversationRepository } from 'core/repositories/conversations'
import { IOEvent } from 'core/sdk/impl'
import { EventEngine } from '../middleware/event-engine'

@injectable()
export class MessagingAPI {
  constructor(
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.MessageRepository) private messageRepo: MessageRepository,
    @inject(TYPES.ConversationRepository) private conversationRepo: ConversationRepository
  ) {}
  public async getAllConversations(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation[]> {
    return this.conversationRepo.getAll(endpoint)
  }

  public async deleteAllConversations(endpoint: sdk.UserEndpoint): Promise<number> {
    return this.conversationRepo.deleteAll(endpoint)
  }

  public async createConversation(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation> {
    return this.conversationRepo.create(endpoint)
  }

  public async getOrCreateRecentConversation(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation> {
    return (await this.conversationRepo.getMostRecent(endpoint)) ?? this.conversationRepo.create(endpoint)
  }

  public async getConversationById(conversationId: number): Promise<sdk.Conversation | undefined> {
    return this.conversationRepo.getById(conversationId)
  }

  public async deleteConversation(conversationId: number): Promise<boolean> {
    return this.conversationRepo.delete(conversationId)
  }

  public async getAllMessages(conversationId: number): Promise<sdk.Message[]> {
    return this.messageRepo.getAll(conversationId)
  }

  public async deleteAllMessages(conversationId: number): Promise<number> {
    return this.messageRepo.deleteAll(conversationId)
  }

  public async createMessage(
    conversationId: number,
    eventId: string,
    incomingEventId: string,
    from: string,
    payload: any
  ): Promise<sdk.Message> {
    return this.messageRepo.create(conversationId, eventId, incomingEventId, from, payload)
  }

  public async getMessageById(messageId: number): Promise<sdk.Message | undefined> {
    return this.messageRepo.getById(messageId)
  }

  public async deleteMessage(messageId: number): Promise<boolean> {
    return this.messageRepo.delete(messageId)
  }

  public async sendIncoming(conversationId: number, payload: any, args?: Partial<sdk.IO.EventCtorArgs>) {
    return this.sendMessage(conversationId, payload, 'incoming', args)
  }

  public async sendOutgoing(conversationId: number, payload: any, args?: Partial<sdk.IO.EventCtorArgs>) {
    return this.sendMessage(conversationId, payload, 'outgoing', args)
  }

  private async sendMessage(
    conversationId: number,
    payload: any,
    direction: sdk.EventDirection,
    args?: Partial<sdk.IO.EventCtorArgs>
  ) {
    const ctorArgs: Partial<sdk.IO.EventCtorArgs> = {
      direction,
      type: payload.type,
      payload,
      ...args
    }

    if (!ctorArgs.threadId || !ctorArgs.target || !ctorArgs.botId) {
      const conversation = await this.getConversationById(conversationId)

      if (!conversation) {
        throw new Error(
          'conversationId: conversation not found. conversationId must be the id of an existing conversation'
        )
      }

      ctorArgs.threadId = conversation.id.toString()
      ctorArgs.target = conversation.userId
      ctorArgs.botId = conversation.botId
    }

    const event = new IOEvent(<sdk.IO.EventCtorArgs>ctorArgs)
    await this.eventEngine.sendEvent(event)

    return this.messageRepo.create(
      conversationId,
      event.id,
      event.id,
      event.direction === 'incoming' ? 'user' : 'bot',
      payload
    )
  }
}

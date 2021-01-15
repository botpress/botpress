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

  public async getOrCreateRecentConversation(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation | undefined> {
    return this.conversationRepo.getMostRecent(endpoint) ?? this.conversationRepo.create(endpoint)
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
    payload: any
  ): Promise<sdk.Message> {
    return this.messageRepo.create(conversationId, eventId, incomingEventId, 'bot', payload)
  }

  public async getMessageById(messageId: number): Promise<sdk.Message | undefined> {
    return this.messageRepo.getById(messageId)
  }

  public async deleteMessage(messageId: number): Promise<boolean> {
    return this.messageRepo.delete(messageId)
  }

  public async sendMessage(
    destination: sdk.MessageDestination,
    payload: any,
    args?: Partial<sdk.IO.EventCtorArgs>
  ): Promise<sdk.Message> {
    const event = new IOEvent({
      ...args,
      botId: destination.botId,
      channel: destination.channel,
      direction: 'incoming',
      payload,
      target: destination.userId,
      threadId: destination.conversationId.toString(),
      type: payload.type
      // TODO
      // credentials
    })

    await this.eventEngine.sendEvent(event)

    return this.messageRepo.create(destination.conversationId, event.id, event.id, 'user', payload)
  }
}

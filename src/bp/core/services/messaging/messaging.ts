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

  public async createConversation(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation> {
    return this.conversationRepo.create(endpoint)
  }

  public async getAllConversations(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation[]> {
    return this.conversationRepo.getAll(endpoint)
  }

  public async getOrCreateRecentConversation(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation | undefined> {
    return this.conversationRepo.getMostRecent(endpoint) ?? this.conversationRepo.create(endpoint)
  }

  public async getConversationById(conversationId: number): Promise<sdk.Conversation | undefined> {
    return this.conversationRepo.getById(conversationId)
  }

  public async getConversationMessages(conversationId: number): Promise<sdk.Message[]> {
    return this.messageRepo.getAll(conversationId)
  }

  public async sendMessage(destination: sdk.MessageDestination, payload: any): Promise<sdk.Message> {
    const event = new IOEvent({
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

    return this.messageRepo.create(destination.conversationId, event.id, 'user', payload)
  }

  public async appendMessage(conversationId: number, eventId: string, payload: any): Promise<sdk.Message> {
    return this.messageRepo.create(conversationId, eventId, 'bot', payload)
  }
}

import * as sdk from 'botpress/sdk'
import { TYPES } from 'core/app/types'
import { MessageRepository } from 'core/messaging'
import { inject, injectable } from 'inversify'

import { ConversationService, ScopedConversationService } from './conversation-service'

@injectable()
export class MessageService {
  private scopes: { [botId: string]: ScopedMessageService } = {}

  constructor(
    @inject(TYPES.MessageRepository) private messageRepo: MessageRepository,
    @inject(TYPES.ConversationService) private conversationService: ConversationService
  ) {}

  public forBot(botId: string): ScopedMessageService {
    let scope = this.scopes[botId]
    if (!scope) {
      scope = new ScopedMessageService(botId, this.messageRepo, this.conversationService.forBot(botId))
      this.scopes[botId] = scope
    }
    return scope
  }
}

export class ScopedMessageService {
  constructor(
    private botId: string,
    private messageRepo: MessageRepository,
    private conversationService: ScopedConversationService
  ) {}

  public async list(filters: sdk.MessageListFilters): Promise<sdk.Message[]> {
    return this.messageRepo.list(filters)
  }

  public async delete(filters: sdk.MessageDeleteFilters): Promise<number> {
    if (filters.id) {
      const message = await this.messageRepo.get(filters.id)

      if (message) {
        const conversation = (await this.conversationService.get(message.conversationId))!
        this.conversationService.invalidateMostRecent(conversation.userId)
      }

      return (await this.messageRepo.delete(filters.id)) ? 1 : 0
    } else {
      const conversation = (await this.conversationService.get(filters.conversationId!))!
      this.conversationService.invalidateMostRecent(conversation.userId)

      return this.messageRepo.deleteAll(filters.conversationId!)
    }
  }

  public async create(
    conversationId: sdk.uuid,
    payload: any,
    authorId?: string,
    eventId?: string,
    incomingEventId?: string
  ): Promise<sdk.Message> {
    const message = await this.messageRepo.create(conversationId, payload, authorId, eventId, incomingEventId)
    const conversation = (await this.conversationService.get(conversationId))!
    await this.conversationService.setAsMostRecent(conversation)
    return message
  }

  public async get(id: sdk.uuid): Promise<sdk.Message | undefined> {
    return this.messageRepo.get(id)
  }
}

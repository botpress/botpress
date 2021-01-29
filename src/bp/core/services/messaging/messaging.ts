import { inject, injectable, postConstruct } from 'inversify'
import * as sdk from 'botpress/sdk'
import { TYPES } from '../../types'
import { MessageRepository } from 'core/repositories/messages'
import { ConversationRepository } from 'core/repositories/conversations'
import { IOEvent } from 'core/sdk/impl'
import { EventEngine } from '../middleware/event-engine'
import { KeyValueStore } from '../kvs'
import LRU from 'lru-cache'
import { JobService } from '../job-service'
import ms from 'ms'

@injectable()
export class MessagingAPI {
  private mostRecentCaches: { [botId: string]: LRU<string, sdk.Conversation> } = {}
  public invalidateMostRecent: (endpoint: sdk.UserEndpoint, mostRecentConvoId?: number) => void = this
    ._localInvalidateMostRecent

  constructor(
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.JobService) private jobService: JobService,
    @inject(TYPES.MessageRepository) private messageRepo: MessageRepository,
    @inject(TYPES.ConversationRepository) private conversationRepo: ConversationRepository,
    @inject(TYPES.KeyValueStore) private kvs: KeyValueStore
  ) {}

  @postConstruct()
  async init() {
    this.invalidateMostRecent = <any>await this.jobService.broadcast<void>(this._localInvalidateMostRecent.bind(this))
  }

  public async getAllConversations(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation[]> {
    return this.conversationRepo.getAll(endpoint)
  }

  public async getAllRecentConversations(endpoint: sdk.UserEndpoint): Promise<sdk.RecentConversation[]> {
    return this.conversationRepo.getAllRecent(endpoint)
  }

  public async deleteAllConversations(endpoint: sdk.UserEndpoint): Promise<number> {
    this.invalidateMostRecent(endpoint)

    return this.conversationRepo.deleteAll(endpoint)
  }

  public async createConversation(endpoint: sdk.UserEndpoint): Promise<sdk.Conversation> {
    return this.conversationRepo.create(endpoint)
  }

  public async getOrCreateRecentConversation(endpoint: sdk.UserEndpoint): Promise<sdk.RecentConversation> {
    const cached = this.cacheForBot(endpoint.botId).get(endpoint.userId)
    if (cached) {
      return cached
    }

    let conversation = await this.conversationRepo.getMostRecent(endpoint)
    if (!conversation) {
      conversation = await this.conversationRepo.create(endpoint)
    }

    this.cacheForBot(endpoint.botId).set(endpoint.userId, conversation)

    return conversation
  }

  public async getConversationById(conversationId: number): Promise<sdk.Conversation | undefined> {
    return this.conversationRepo.getById(conversationId)
  }

  public async deleteConversation(conversationId: number): Promise<boolean> {
    const conversation = (await this.conversationRepo.getById(conversationId))!
    this.invalidateMostRecent(conversation)

    return this.conversationRepo.delete(conversationId)
  }

  public async getAllMessages(conversationId: number): Promise<sdk.Message[]> {
    return this.messageRepo.getAll(conversationId)
  }

  public async deleteAllMessages(conversationId: number): Promise<number> {
    const conversation = (await this.conversationRepo.getById(conversationId))!
    this.invalidateMostRecent(conversation)

    return this.messageRepo.deleteAll(conversationId)
  }

  public async createMessage(
    conversationId: number,
    eventId: string,
    incomingEventId: string,
    from: string,
    payload: any
  ): Promise<sdk.Message> {
    const message = await this.messageRepo.create(conversationId, eventId, incomingEventId, from, payload)
    const conversation = (await this.getConversationById(conversationId))!
    await this.flagAsMostRecent(conversation)
    return message
  }

  public async getMessageById(messageId: number): Promise<sdk.Message | undefined> {
    return this.messageRepo.getById(messageId)
  }

  public async deleteMessage(messageId: number): Promise<boolean> {
    const message = await this.messageRepo.getById(messageId)

    if (message) {
      const conversation = (await this.conversationRepo.getById(message.conversationId))!
      this.invalidateMostRecent(conversation)
    }

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
    const conversation = await this.getConversationById(conversationId)
    if (!conversation) {
      throw new Error(
        'conversationId: conversation not found. conversationId must be the id of an existing conversation'
      )
    }

    args = {
      ...args,
      direction,
      type: payload.type,
      payload,
      threadId: conversation.id.toString(),
      target: conversation.userId,
      botId: conversation.botId
    }

    if (!args.channel) {
      const lastChannel = await this.kvs.forBot(args.botId!).get(`lastChannel_${args.botId}_${args.target}`)
      if (lastChannel) {
        throw new Error('No previous channel was set for the user. You must provide a threadId in the args parameter')
      }
      args.threadId = lastChannel
    }

    const event = new IOEvent(<sdk.IO.EventCtorArgs>args)
    await this.eventEngine.sendEvent(event)

    const message = await this.messageRepo.create(
      conversationId,
      event.id,
      event.id,
      event.direction === 'incoming' ? 'user' : 'bot',
      payload
    )
    await this.flagAsMostRecent(conversation)
    return message
  }

  private cacheForBot(botId: string) {
    let cache = this.mostRecentCaches[botId]
    if (!cache) {
      cache = new LRU<string, sdk.Conversation>({ max: 10000, maxAge: ms('5min') })
      this.mostRecentCaches[botId] = cache
    }

    return cache
  }

  private async flagAsMostRecent(conversation: sdk.Conversation) {
    const cache = this.cacheForBot(conversation.botId)
    const currentMostRecent = cache.peek(conversation.userId)

    if (currentMostRecent?.id !== conversation.id) {
      this.invalidateMostRecent({ userId: conversation.userId, botId: conversation.botId }, conversation.id)
      cache.set(conversation.userId, conversation)
    }
  }

  private _localInvalidateMostRecent(endpoint: sdk.UserEndpoint, mostRecentConvoId?: number) {
    if (endpoint) {
      const cache = this.cacheForBot(endpoint.botId)
      const cachedMostRecent = cache.peek(endpoint.userId)
      if (cachedMostRecent?.id != mostRecentConvoId) {
        cache.del(endpoint.userId)
      }
    }
  }
}

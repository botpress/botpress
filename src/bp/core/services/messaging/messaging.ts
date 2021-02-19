import * as sdk from 'botpress/sdk'
import { ConversationRepository } from 'core/repositories/conversations'
import { MessageRepository } from 'core/repositories/messages'
import { IOEvent } from 'core/sdk/impl'
import { inject, injectable, postConstruct } from 'inversify'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import LRU from 'lru-cache'
import ms from 'ms'
import { TYPES } from '../../types'
import { JobService } from '../job-service'
import { KeyValueStore } from '../kvs'
import { EventEngine } from '../middleware/event-engine'

@injectable()
export class MessagingAPI {
  private mostRecentCaches: { [botId: string]: LRU<string, sdk.experimental.Conversation> } = {}
  private lastChannelCaches: { [botId: string]: LRU<string, string> } = {}
  private invalidateMostRecent: (endpoint: sdk.experimental.UserEndpoint, mostRecentConvoId?: number) => void = this
    ._localInvalidateMostRecent
  private invalidateLastChannel: (endpoint: sdk.experimental.UserEndpoint, lastChannel: string) => void = this
    ._localInvalidateLastChannel

  constructor(
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.JobService) private jobService: JobService,
    @inject(TYPES.MessageRepository) private messageRepo: MessageRepository,
    @inject(TYPES.ConversationRepository) private conversationRepo: ConversationRepository,
    @inject(TYPES.KeyValueStore) private kvs: KeyValueStore
  ) {}

  @postConstruct()
  async init() {
    await AppLifecycle.waitFor(AppLifecycleEvents.CONFIGURATION_LOADED)

    this.invalidateMostRecent = <any>await this.jobService.broadcast<void>(this._localInvalidateMostRecent.bind(this))
    this.invalidateLastChannel = <any>await this.jobService.broadcast<void>(this._localInvalidateLastChannel.bind(this))

    this.eventEngine.onSendIncoming = async event => {
      await this.updateLastChannel({ userId: event.target, botId: event.botId }, event.channel)
    }
  }

  public async getAllConversations(endpoint: sdk.experimental.UserEndpoint): Promise<sdk.experimental.Conversation[]> {
    return this.conversationRepo.getAll(endpoint)
  }

  public async getRecentConversations(
    endpoint: sdk.experimental.UserEndpoint,
    limit?: number
  ): Promise<sdk.experimental.RecentConversation[]> {
    return this.conversationRepo.getAllRecent(endpoint, limit)
  }

  public async deleteAllConversations(endpoint: sdk.experimental.UserEndpoint): Promise<number> {
    this.invalidateMostRecent(endpoint)

    return this.conversationRepo.deleteAll(endpoint)
  }

  public async createConversation(endpoint: sdk.experimental.UserEndpoint): Promise<sdk.experimental.Conversation> {
    return this.conversationRepo.create(endpoint)
  }

  public async getOrCreateRecentConversation(
    endpoint: sdk.experimental.UserEndpoint
  ): Promise<sdk.experimental.RecentConversation> {
    const cached = this.recentConvoCacheForBot(endpoint.botId).get(endpoint.userId)
    if (cached) {
      return cached
    }

    let conversation = await this.conversationRepo.getMostRecent(endpoint)
    if (!conversation) {
      conversation = await this.conversationRepo.create(endpoint)
    }

    this.recentConvoCacheForBot(endpoint.botId).set(endpoint.userId, conversation)

    return conversation
  }

  public async getConversationById(conversationId: number): Promise<sdk.experimental.Conversation | undefined> {
    return this.conversationRepo.getById(conversationId)
  }

  public async deleteConversation(conversationId: number): Promise<boolean> {
    const conversation = (await this.conversationRepo.getById(conversationId))!
    this.invalidateMostRecent(conversation)

    return this.conversationRepo.delete(conversationId)
  }

  public async getRecentMessages(conversationId: number, limit?: number): Promise<sdk.experimental.Message[]> {
    return this.messageRepo.getAll(conversationId, limit)
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
  ): Promise<sdk.experimental.Message> {
    const message = await this.messageRepo.create(conversationId, eventId, incomingEventId, from, payload)
    const conversation = (await this.getConversationById(conversationId))!
    await this.flagAsMostRecent(conversation)
    return message
  }

  public async getMessageById(messageId: number): Promise<sdk.experimental.Message | undefined> {
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

  public async sendIncoming(conversationId: number, payload: any, args?: sdk.experimental.messages.MessageArgs) {
    return this.sendMessage(conversationId, payload, 'incoming', args)
  }

  public async sendOutgoing(conversationId: number, payload: any, args?: sdk.experimental.messages.MessageArgs) {
    return this.sendMessage(conversationId, payload, 'outgoing', args)
  }

  private async sendMessage(
    conversationId: number,
    payload: any,
    direction: sdk.EventDirection,
    args?: sdk.experimental.messages.MessageArgs
  ) {
    const conversation = await this.getConversationById(conversationId)
    if (!conversation) {
      throw new Error(
        'conversationId: conversation not found. conversationId must be the id of an existing conversation'
      )
    }

    const ctorArgs = {
      ...args,
      direction,
      type: payload.type,
      payload,
      threadId: conversation.id.toString(),
      target: conversation.userId,
      botId: conversation.botId
    }

    if (!ctorArgs.channel) {
      const lastChannel = await this.getLastChannel({ userId: ctorArgs.target, botId: ctorArgs.botId })
      if (!lastChannel) {
        throw new Error('No previous channel was set for the user. You must provide a channel in the args parameter')
      }
      ctorArgs.channel = lastChannel
    } else if (direction === 'incoming') {
      await this.updateLastChannel({ userId: ctorArgs.target, botId: ctorArgs.botId }, ctorArgs.channel)
    }

    const event = new IOEvent(<sdk.IO.EventCtorArgs>ctorArgs)
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

  private lastChannelCacheForBot(botId: string) {
    let cache = this.lastChannelCaches[botId]
    if (!cache) {
      cache = new LRU<string, string>({ max: 10000, maxAge: ms('5min') })
      this.lastChannelCaches[botId] = cache
    }

    return cache
  }

  private async getLastChannel(endpoint: sdk.experimental.UserEndpoint): Promise<string | undefined> {
    const cache = this.lastChannelCacheForBot(endpoint.botId)
    const cached = cache.get(endpoint.userId)
    if (cached) {
      return cached
    }

    const lastChannel = await this.kvs.forBot(endpoint.botId).get(this.getLastChannelKvsKey(endpoint))
    cache.set(endpoint.userId, lastChannel)

    return lastChannel
  }

  private async updateLastChannel(endpoint: sdk.experimental.UserEndpoint, channel: string) {
    const cache = this.lastChannelCacheForBot(endpoint.botId)
    const current = cache.get(endpoint.userId)
    if (current === channel) {
      return
    }

    await this.kvs.forBot(endpoint.botId).set(this.getLastChannelKvsKey(endpoint), channel, undefined, '48h')
    this.invalidateLastChannel(endpoint, channel)
  }

  private getLastChannelKvsKey(endpoint: sdk.experimental.UserEndpoint) {
    return `lastChannel_${endpoint.botId}_${endpoint.userId}`
  }

  private _localInvalidateLastChannel(endpoint: sdk.experimental.UserEndpoint, lastChannel: string) {
    if (endpoint) {
      const cache = this.lastChannelCacheForBot(endpoint.botId)
      const cachedLastChannel = cache.peek(endpoint.userId)
      if (cachedLastChannel !== lastChannel) {
        cache.del(endpoint.userId)
      }
    }
  }

  private recentConvoCacheForBot(botId: string) {
    let cache = this.mostRecentCaches[botId]
    if (!cache) {
      cache = new LRU<string, sdk.experimental.Conversation>({ max: 10000, maxAge: ms('5min') })
      this.mostRecentCaches[botId] = cache
    }

    return cache
  }

  private async flagAsMostRecent(conversation: sdk.experimental.Conversation) {
    const cache = this.recentConvoCacheForBot(conversation.botId)
    const currentMostRecent = cache.peek(conversation.userId)

    if (currentMostRecent?.id !== conversation.id) {
      this.invalidateMostRecent({ userId: conversation.userId, botId: conversation.botId }, conversation.id)
      cache.set(conversation.userId, conversation)
    }
  }

  private _localInvalidateMostRecent(endpoint: sdk.experimental.UserEndpoint, mostRecentConvoId?: number) {
    if (endpoint) {
      const cache = this.recentConvoCacheForBot(endpoint.botId)
      const cachedMostRecent = cache.peek(endpoint.userId)
      if (cachedMostRecent?.id !== mostRecentConvoId) {
        cache.del(endpoint.userId)
      }
    }
  }
}

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
  private botMessages: { [botId: string]: sdk.experimental.messages.BotMessages } = {}
  private botConversations: { [botId: string]: sdk.experimental.conversations.BotConversations } = {}

  constructor(
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.JobService) private jobService: JobService,
    @inject(TYPES.MessageRepository) private messageRepo: MessageRepository,
    @inject(TYPES.ConversationRepository) private conversationRepo: ConversationRepository,
    @inject(TYPES.KeyValueStore) private kvs: KeyValueStore
  ) {}

  public forBotMessages(botId: string): sdk.experimental.messages.BotMessages {
    let botMessages = this.botMessages[botId]
    if (!botMessages) {
      const impl = new ScopedMessaging(
        botId,
        this.eventEngine,
        this.jobService,
        this.messageRepo,
        this.conversationRepo,
        this.kvs
      )
      botMessages = {
        send: impl.sendOutgoing.bind(impl),
        receive: impl.sendIncoming.bind(impl),
        create: impl.createMessage.bind(impl),
        del: impl.deleteMessages.bind(impl),
        get: impl.getMessage.bind(impl),
        list: impl.listMessages.bind(impl)
      }
    }
    return botMessages
  }

  public forBotConversations(botId: string): sdk.experimental.conversations.BotConversations {
    let botConversations = this.botConversations[botId]
    if (!botConversations) {
      const impl = new ScopedMessaging(
        botId,
        this.eventEngine,
        this.jobService,
        this.messageRepo,
        this.conversationRepo,
        this.kvs
      )
      botConversations = {
        create: impl.createConversation.bind(impl),
        del: impl.deleteConversations.bind(impl),
        get: impl.getConversation.bind(impl),
        list: impl.listConversations.bind(impl),
        recent: impl.recentConversation.bind(impl)
      }
    }
    return botConversations
  }
}

export class ScopedMessaging {
  private mostRecentCaches: { [botId: string]: LRU<string, sdk.experimental.Conversation> } = {}
  private lastChannelCaches: { [botId: string]: LRU<string, string> } = {}
  private invalidateMostRecent: (endpoint: sdk.experimental.UserEndpoint, mostRecentConvoId?: number) => void = this
    ._localInvalidateMostRecent
  private invalidateLastChannel: (endpoint: sdk.experimental.UserEndpoint, lastChannel: string) => void = this
    ._localInvalidateLastChannel

  constructor(
    private botId: string,
    private eventEngine: EventEngine,
    private jobService: JobService,
    private messageRepo: MessageRepository,
    private conversationRepo: ConversationRepository,
    private kvs: KeyValueStore
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

  public async listConversations(
    filters: sdk.experimental.conversations.ListFilters
  ): Promise<sdk.experimental.RecentConversation[]> {
    return this.conversationRepo.list({ userId: filters.userId!, botId: this.botId }, filters.limit)
  }

  public async deleteConversations(filters: sdk.experimental.conversations.DeleteFilters): Promise<number> {
    if (filters.id) {
      const conversation = (await this.conversationRepo.get(filters.id))!
      this.invalidateMostRecent(conversation)

      return (await this.conversationRepo.delete(filters.id)) ? 1 : 0
    } else {
      const endpoint = { userId: filters.userId!, botId: this.botId }
      this.invalidateMostRecent(endpoint)

      return this.conversationRepo.deleteAll(endpoint)
    }
  }

  public async createConversation(
    endpoint: sdk.experimental.conversations.CreateArgs
  ): Promise<sdk.experimental.Conversation> {
    return this.conversationRepo.create(endpoint)
  }

  public async recentConversation(
    filters: sdk.experimental.conversations.RecentFilters
  ): Promise<sdk.experimental.RecentConversation> {
    const endpoint = { userId: filters.userId!, botId: this.botId }
    const cached = this.recentConvoCacheForBot(endpoint.botId).get(endpoint.userId)
    if (cached) {
      return cached
    }

    let conversation = await this.conversationRepo.recent(endpoint)
    if (!conversation) {
      conversation = await this.conversationRepo.create(endpoint)
    }

    this.recentConvoCacheForBot(endpoint.botId).set(endpoint.userId, conversation)

    return conversation
  }

  public async getConversation(
    filters: sdk.experimental.conversations.GetFilters
  ): Promise<sdk.experimental.Conversation | undefined> {
    return this.conversationRepo.get(filters.id)
  }

  public async listMessages(filters: sdk.experimental.messages.ListFilters): Promise<sdk.experimental.Message[]> {
    return this.messageRepo.list(filters.conversationId, filters.limit)
  }

  public async deleteMessages(filters: sdk.experimental.messages.DeleteFilters): Promise<number> {
    if (filters.id) {
      const message = await this.messageRepo.get(filters.id)

      if (message) {
        const conversation = (await this.conversationRepo.get(message.conversationId))!
        this.invalidateMostRecent(conversation)
      }

      return (await this.messageRepo.delete(filters.id)) ? 1 : 0
    } else {
      const conversation = (await this.conversationRepo.get(filters.conversationId!))!
      this.invalidateMostRecent(conversation)

      return this.messageRepo.deleteAll(filters.conversationId!)
    }
  }

  public async createMessage(args: sdk.experimental.messages.CreateArgs): Promise<sdk.experimental.Message> {
    const message = await this.messageRepo.create(
      args.conversationId,
      args.eventId,
      args.incomingEventId,
      args.from,
      args.payload
    )
    const conversation = (await this.getConversation({ id: args.conversationId }))!
    await this.flagAsMostRecent(conversation)
    return message
  }

  public async getMessage(
    filters: sdk.experimental.messages.GetFilters
  ): Promise<sdk.experimental.Message | undefined> {
    return this.messageRepo.get(filters.id)
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
    const conversation = await this.getConversation({ id: conversationId })
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

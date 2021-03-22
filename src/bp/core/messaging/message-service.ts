import * as sdk from 'botpress/sdk'
import { TYPES } from 'core/app/types'
import { JobService } from 'core/distributed'
import { EventEngine, IOEvent } from 'core/events'
import { KeyValueStore } from 'core/kvs'
import { MessageRepository } from 'core/messaging'
import { inject, injectable, postConstruct } from 'inversify'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import LRU from 'lru-cache'
import ms from 'ms'

import { ConversationService, ScopedConversationService } from './conversation-service'

@injectable()
export class MessageService {
  private scopes: { [botId: string]: ScopedMessageService } = {}
  private invalidateLastChannel: (botId: string, userId: string, lastChannel: string) => void = this
    ._localInvalidateLastChannel

  constructor(
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.JobService) private jobService: JobService,
    @inject(TYPES.MessageRepository) private messageRepo: MessageRepository,
    @inject(TYPES.ConversationService) private conversationService: ConversationService,
    @inject(TYPES.KeyValueStore) private kvs: KeyValueStore
  ) {}

  @postConstruct()
  async init() {
    await AppLifecycle.waitFor(AppLifecycleEvents.CONFIGURATION_LOADED)

    this.eventEngine.onSendIncoming = async event => {
      await this.forBot(event.botId).updateLastChannel(event.target, event.channel)
    }

    this.invalidateLastChannel = <any>await this.jobService.broadcast<void>(this._localInvalidateLastChannel.bind(this))
  }

  private _localInvalidateLastChannel(botId: string, userId: string, lastChannel: string) {
    this.forBot(botId).localInvalidateLastChannel(userId, lastChannel)
  }

  public forBot(botId: string): ScopedMessageService {
    let scope = this.scopes[botId]
    if (!scope) {
      scope = new ScopedMessageService(
        botId,
        this.eventEngine,
        this.messageRepo,
        this.conversationService.forBot(botId),
        this.kvs,
        (userId, lastChannel) => this.invalidateLastChannel(botId, userId, lastChannel)
      )
      this.scopes[botId] = scope
    }
    return scope
  }
}

export class ScopedMessageService implements sdk.experimental.messages.BotMessages {
  private lastChannelCache: LRU<string, string>

  constructor(
    private botId: string,
    private eventEngine: EventEngine,
    private messageRepo: MessageRepository,
    private conversationService: ScopedConversationService,
    private kvs: KeyValueStore,
    private invalidateLastChannel: (userId: string, lastChannel: string) => void
  ) {
    this.lastChannelCache = new LRU<string, string>({ max: 10000, maxAge: ms('5min') })
  }

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
    from: string,
    eventId?: string,
    incomingEventId?: string
  ): Promise<sdk.Message> {
    const message = await this.messageRepo.create(conversationId, payload, from, eventId, incomingEventId)
    const conversation = (await this.conversationService.get(conversationId))!
    await this.conversationService.setAsMostRecent(conversation)
    return message
  }

  public async get(id: sdk.uuid): Promise<sdk.Message | undefined> {
    return this.messageRepo.get(id)
  }

  public async receive(conversationId: sdk.uuid, payload: any, args?: sdk.MessageArgs) {
    return this.sendMessage(conversationId, payload, 'incoming', args)
  }

  public async send(conversationId: sdk.uuid, payload: any, args?: sdk.MessageArgs) {
    return this.sendMessage(conversationId, payload, 'outgoing', args)
  }

  private async sendMessage(
    conversationId: sdk.uuid,
    payload: any,
    direction: sdk.EventDirection,
    args?: sdk.MessageArgs
  ) {
    const conversation = await this.conversationService.get(conversationId)
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
      const lastChannel = await this.getLastChannel(ctorArgs.target)
      if (!lastChannel) {
        throw new Error('No previous channel was set for the user. You must provide a channel in the args parameter')
      }
      ctorArgs.channel = lastChannel
    } else if (direction === 'incoming') {
      await this.updateLastChannel(ctorArgs.target, ctorArgs.channel)
    }

    const event = new IOEvent(<sdk.IO.EventCtorArgs>ctorArgs)
    await this.eventEngine.sendEvent(event)

    const from = event.direction === 'incoming' ? 'user' : 'bot'
    const message = await this.messageRepo.create(conversationId, payload, from, event.id, event.id)
    await this.conversationService.setAsMostRecent(conversation)

    return message
  }

  private async getLastChannel(userId: string): Promise<string | undefined> {
    const cached = this.lastChannelCache.get(userId)
    if (cached) {
      return cached
    }

    const lastChannel = await this.kvs.forBot(this.botId).get(this.getLastChannelKvsKey(userId))
    this.lastChannelCache.set(userId, lastChannel)

    return lastChannel
  }

  public async updateLastChannel(userId: string, channel: string) {
    const current = this.lastChannelCache.get(userId)
    if (current === channel) {
      return
    }

    await this.kvs.forBot(this.botId).set(this.getLastChannelKvsKey(userId), channel, undefined, '48h')
    this.invalidateLastChannel(userId, channel)
  }

  private getLastChannelKvsKey(userId: string) {
    return `lastChannel_${this.botId}_${userId}`
  }

  public localInvalidateLastChannel(userId: string, lastChannel: string) {
    if (userId) {
      const cachedLastChannel = this.lastChannelCache.peek(userId)
      if (cachedLastChannel !== lastChannel) {
        this.lastChannelCache.del(userId)
      }
    }
  }
}

import * as sdk from 'botpress/sdk'
import { TYPES } from 'core/app/types'
import { JobService } from 'core/distributed'
import { EventEngine, IOEvent } from 'core/events'
import { KeyValueStore } from 'core/kvs'
import { inject, injectable, postConstruct } from 'inversify'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import LRU from 'lru-cache'
import ms from 'ms'

import { ConversationService, ScopedConversationService } from './conversation-service'
import { MessageService, ScopedMessageService } from './message-service'

@injectable()
export class ChatService {
  private scopes: { [botId: string]: ScopedChatService } = {}
  private invalidateLastChannel: (botId: string, userId: string, lastChannel: string) => void = this
    ._localInvalidateLastChannel

  constructor(
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.JobService) private jobService: JobService,
    @inject(TYPES.MessageService) private messageService: MessageService,
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

  public forBot(botId: string): ScopedChatService {
    let scope = this.scopes[botId]
    if (!scope) {
      scope = new ScopedChatService(
        botId,
        this.eventEngine,
        this.messageService.forBot(botId),
        this.conversationService.forBot(botId),
        this.kvs,
        (userId, lastChannel) => this.invalidateLastChannel(botId, userId, lastChannel)
      )
      this.scopes[botId] = scope
    }
    return scope
  }
}

export class ScopedChatService implements sdk.experimental.messages.BotMessages {
  private lastChannelCache: LRU<string, string>

  constructor(
    private botId: string,
    private eventEngine: EventEngine,
    private messageService: ScopedMessageService,
    private conversationService: ScopedConversationService,
    private kvs: KeyValueStore,
    private invalidateLastChannel: (userId: string, lastChannel: string) => void
  ) {
    this.lastChannelCache = new LRU<string, string>({ max: 10000, maxAge: ms('5min') })
  }

  public create(
    conversationId: string,
    payload: any,
    authorId?: string,
    eventId?: string,
    incomingEventId?: string
  ): Promise<sdk.Message> {
    return this.messageService.create(conversationId, payload, authorId, eventId, incomingEventId)
  }

  public delete(filters: sdk.MessageDeleteFilters): Promise<number> {
    return this.messageService.delete(filters)
  }

  public get(id: string): Promise<sdk.Message | undefined> {
    return this.messageService.get(id)
  }

  public list(filters: sdk.MessageListFilters): Promise<sdk.Message[]> {
    return this.messageService.list(filters)
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

    let channel = args?.channel
    if (!channel) {
      const lastChannel = await this.getLastChannel(conversation.userId)
      if (!lastChannel) {
        throw new Error('No previous channel was set for the user. You must provide a channel in the args parameter')
      }
      channel = lastChannel
    } else if (direction === 'incoming') {
      await this.updateLastChannel(conversation.userId, channel)
    }

    const authorId = direction === 'incoming' ? conversation.userId : undefined
    const message = await this.messageService.create(conversationId, payload, authorId)

    const event = new IOEvent(<sdk.IO.EventCtorArgs>{
      ...args,
      id: message.id,
      channel,
      direction,
      type: payload.type,
      payload,
      threadId: conversation.id,
      target: conversation.userId,
      botId: conversation.botId
    })
    await this.eventEngine.sendEvent(event)

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

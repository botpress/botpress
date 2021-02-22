import * as sdk from 'botpress/sdk'
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
import { ConversationService, ScopedConversationService } from './conversations'

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

  public async list(filters: sdk.experimental.messages.ListFilters): Promise<sdk.experimental.Message[]> {
    return this.messageRepo.list(filters)
  }

  public async delete(filters: sdk.experimental.messages.DeleteFilters): Promise<number> {
    if (filters.id) {
      const message = await this.messageRepo.get(filters.id)

      if (message) {
        const conversation = (await this.conversationService.get({ id: message.conversationId }))!
        this.conversationService.invalidateMostRecent(conversation.userId)
      }

      return (await this.messageRepo.delete(filters.id)) ? 1 : 0
    } else {
      const conversation = (await this.conversationService.get({ id: filters.conversationId! }))!
      this.conversationService.invalidateMostRecent(conversation.userId)

      return this.messageRepo.deleteAll(filters.conversationId!)
    }
  }

  public async create(args: sdk.experimental.messages.CreateArgs): Promise<sdk.experimental.Message> {
    const message = await this.messageRepo.create(args)
    const conversation = (await this.conversationService.get({ id: args.conversationId }))!
    await this.conversationService.flagAsMostRecent(conversation)
    return message
  }

  public async get(filters: sdk.experimental.messages.GetFilters): Promise<sdk.experimental.Message | undefined> {
    return this.messageRepo.get(filters.id)
  }

  public async receive(conversationId: number, payload: any, args?: sdk.experimental.messages.MessageArgs) {
    return this.sendMessage(conversationId, payload, 'incoming', args)
  }

  public async send(conversationId: number, payload: any, args?: sdk.experimental.messages.MessageArgs) {
    return this.sendMessage(conversationId, payload, 'outgoing', args)
  }

  private async sendMessage(
    conversationId: number,
    payload: any,
    direction: sdk.EventDirection,
    args?: sdk.experimental.messages.MessageArgs
  ) {
    const conversation = await this.conversationService.get({ id: conversationId })
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

    const message = await this.messageRepo.create({
      conversationId,
      eventId: event.id,
      incomingEventId: event.id,
      from: event.direction === 'incoming' ? 'user' : 'bot',
      payload
    })
    await this.conversationService.flagAsMostRecent(conversation)
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

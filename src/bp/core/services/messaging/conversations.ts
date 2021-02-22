import * as sdk from 'botpress/sdk'
import { ConversationRepository } from 'core/repositories/conversations'
import { inject, injectable, postConstruct } from 'inversify'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import LRU from 'lru-cache'
import ms from 'ms'
import { TYPES } from '../../types'
import { JobService } from '../job-service'

@injectable()
export class ConversationService {
  private scopes: { [botId: string]: ScopedConversationService } = {}
  private invalidateMostRecent: (botId: string, userId: string, mostRecentConvoId?: number) => void = this
    ._localInvalidateMostRecent

  constructor(
    @inject(TYPES.JobService) private jobService: JobService,
    @inject(TYPES.ConversationRepository) private conversationRepo: ConversationRepository
  ) {}

  @postConstruct()
  async init() {
    await AppLifecycle.waitFor(AppLifecycleEvents.CONFIGURATION_LOADED)

    this.invalidateMostRecent = <any>await this.jobService.broadcast<void>(this._localInvalidateMostRecent.bind(this))
  }

  private _localInvalidateMostRecent(botId: string, userId: string, mostRecentConvoId?: number) {
    this.forBot(botId).localInvalidateMostRecent(userId, mostRecentConvoId)
  }

  public forBot(botId: string): ScopedConversationService {
    let scope = this.scopes[botId]
    if (!scope) {
      scope = new ScopedConversationService(botId, this.conversationRepo, (userId, mostRecentConvoId) =>
        this.invalidateMostRecent(botId, userId, mostRecentConvoId)
      )
      this.scopes[botId] = scope
    }
    return scope
  }
}

export class ScopedConversationService implements sdk.experimental.conversations.BotConversations {
  private mostRecentCache: LRU<string, sdk.experimental.Conversation>

  constructor(
    private botId: string,
    private conversationRepo: ConversationRepository,
    public invalidateMostRecent: (userId: string, mostRecentConvoId?: number) => void
  ) {
    this.mostRecentCache = new LRU<string, sdk.experimental.Conversation>({ max: 10000, maxAge: ms('5min') })
  }

  public async list(
    filters: sdk.experimental.conversations.ListFilters
  ): Promise<sdk.experimental.RecentConversation[]> {
    return this.conversationRepo.list(this.botId, filters.userId!, filters.limit, filters.offset)
  }

  public async del(filters: sdk.experimental.conversations.DeleteFilters): Promise<number> {
    if (filters.id) {
      const conversation = (await this.conversationRepo.get(filters.id))!
      this.invalidateMostRecent(conversation.userId)

      return (await this.conversationRepo.delete(filters.id)) ? 1 : 0
    } else {
      this.invalidateMostRecent(filters.userId!)

      return this.conversationRepo.deleteAll(this.botId, filters.userId!)
    }
  }

  public async create(args: sdk.experimental.conversations.CreateArgs): Promise<sdk.experimental.Conversation> {
    return this.conversationRepo.create(this.botId, args)
  }

  public async recent(
    filters: sdk.experimental.conversations.RecentFilters
  ): Promise<sdk.experimental.RecentConversation> {
    const cached = this.mostRecentCache.get(filters.userId!)
    if (cached) {
      return cached
    }

    let conversation = await this.conversationRepo.recent(this.botId, filters.userId!)
    if (!conversation) {
      conversation = await this.conversationRepo.create(this.botId, { userId: filters.userId! })
    }

    this.mostRecentCache.set(filters.userId!, conversation)

    return conversation
  }

  public async get(
    filters: sdk.experimental.conversations.GetFilters
  ): Promise<sdk.experimental.Conversation | undefined> {
    return this.conversationRepo.get(filters.id)
  }

  public async flagAsMostRecent(conversation: sdk.experimental.Conversation) {
    const currentMostRecent = this.mostRecentCache.peek(conversation.userId)

    if (currentMostRecent?.id !== conversation.id) {
      this.invalidateMostRecent(conversation.userId, conversation.id)
      this.mostRecentCache.set(conversation.userId, conversation)
    }
  }

  public localInvalidateMostRecent(userId: string, mostRecentConvoId?: number) {
    if (userId) {
      const cachedMostRecent = this.mostRecentCache.peek(userId)
      if (cachedMostRecent?.id !== mostRecentConvoId) {
        this.mostRecentCache.del(userId)
      }
    }
  }
}

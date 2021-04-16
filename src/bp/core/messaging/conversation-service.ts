import * as sdk from 'botpress/sdk'
import { JobService } from 'core/distributed'
import { MappingRepository, ScopedMappingRepository } from 'core/mapping/mapping-repository'
import { ConversationRepository } from 'core/messaging'
import { TYPES } from 'core/types'
import { inject, injectable, postConstruct } from 'inversify'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import LRU from 'lru-cache'
import ms from 'ms'

@injectable()
export class ConversationService {
  private scopes: { [botId: string]: ScopedConversationService } = {}
  private invalidateMostRecent: (botId: string, userId: string, mostRecentConvoId?: sdk.uuid) => void = this
    ._localInvalidateMostRecent

  constructor(
    @inject(TYPES.JobService) private jobService: JobService,
    @inject(TYPES.ConversationRepository) private conversationRepo: ConversationRepository,
    @inject(TYPES.MappingRepository) private mappingRepo: MappingRepository
  ) {}

  @postConstruct()
  async init() {
    await AppLifecycle.waitFor(AppLifecycleEvents.CONFIGURATION_LOADED)

    this.invalidateMostRecent = <any>await this.jobService.broadcast<void>(this._localInvalidateMostRecent.bind(this))
  }

  private _localInvalidateMostRecent(botId: string, userId: string, mostRecentConvoId?: sdk.uuid) {
    this.forBot(botId).localInvalidateMostRecent(userId, mostRecentConvoId)
  }

  public forBot(botId: string): ScopedConversationService {
    let scope = this.scopes[botId]
    if (!scope) {
      scope = new ScopedConversationService(
        botId,
        this.conversationRepo,
        this.mappingRepo,
        (userId, mostRecentConvoId) => this.invalidateMostRecent(botId, userId, mostRecentConvoId)
      )
      this.scopes[botId] = scope
    }
    return scope
  }
}

export class ScopedConversationService implements sdk.experimental.conversations.BotConversations {
  private mostRecentCache: LRU<string, sdk.Conversation>

  constructor(
    private botId: string,
    private conversationRepo: ConversationRepository,
    private mappingRepo: MappingRepository,
    public invalidateMostRecent: (userId: string, mostRecentConvoId?: sdk.uuid) => void
  ) {
    this.mostRecentCache = new LRU<string, sdk.Conversation>({ max: 10000, maxAge: ms('5min') })
  }

  public async list(filters: sdk.ConversationListFilters): Promise<sdk.RecentConversation[]> {
    return this.conversationRepo.list(this.botId, filters)
  }

  public async delete(filters: sdk.ConversationDeleteFilters): Promise<number> {
    if (filters.id) {
      const conversation = (await this.conversationRepo.get(filters.id))!
      this.invalidateMostRecent(conversation.userId)

      return (await this.conversationRepo.delete(filters.id)) ? 1 : 0
    } else {
      this.invalidateMostRecent(filters.userId!)

      return this.conversationRepo.deleteAll(this.botId, filters.userId!)
    }
  }

  public async create(userId: sdk.uuid): Promise<sdk.Conversation> {
    return this.conversationRepo.create(this.botId, userId)
  }

  public async recent(userId: sdk.uuid): Promise<sdk.Conversation> {
    const cached = this.mostRecentCache.get(userId)
    if (cached) {
      return cached
    }

    let conversation = await this.conversationRepo.recent(this.botId, userId)
    if (!conversation) {
      conversation = await this.conversationRepo.create(this.botId, userId)
    }

    this.mostRecentCache.set(userId, conversation)

    return conversation
  }

  public async get(id: sdk.uuid): Promise<sdk.Conversation | undefined> {
    return this.conversationRepo.get(id)
  }

  public async setAsMostRecent(conversation: sdk.Conversation) {
    const currentMostRecent = this.mostRecentCache.peek(conversation.userId)

    if (currentMostRecent?.id !== conversation.id) {
      this.invalidateMostRecent(conversation.userId, conversation.id)
      this.mostRecentCache.set(conversation.userId, conversation)
    }
  }

  public localInvalidateMostRecent(userId: string, mostRecentConvoId?: sdk.uuid) {
    if (userId) {
      const cachedMostRecent = this.mostRecentCache.peek(userId)
      if (cachedMostRecent?.id !== mostRecentConvoId) {
        this.mostRecentCache.del(userId)
      }
    }
  }

  public async createMapping(channel: string, localId: sdk.uuid, foreignId: string): Promise<void> {
    await this.getMapScope(channel).create(localId, foreignId)
  }

  public async deleteMapping(channel: string, localId: sdk.uuid, foreignId: string): Promise<boolean> {
    return this.getMapScope(channel).delete(localId, foreignId)
  }

  public async getForeignId(channel: string, localId: sdk.uuid): Promise<string | undefined> {
    return this.getMapScope(channel).getForeignId(localId)
  }

  public async getLocalId(channel: string, foreignId: string): Promise<string | undefined> {
    return this.getMapScope(channel).getLocalId(foreignId)
  }

  private getMapScope(channel: string): ScopedMappingRepository {
    return this.mappingRepo.forScope(`${this.botId}-${channel}-conversations`)
  }
}

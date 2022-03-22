import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import LRUCache from 'lru-cache'
import ms from 'ms'

export default class WebchatDb {
  private knex: sdk.KnexExtended
  private cacheByVisitor: LRUCache<string, UserMapping>
  private cacheByUser: LRUCache<string, UserMapping>

  constructor(private bp: typeof sdk) {
    this.knex = bp.database
    this.cacheByVisitor = new LRUCache({ max: 10000, maxAge: ms('5min') })
    this.cacheByUser = new LRUCache({ max: 10000, maxAge: ms('5min') })
  }
  async initialize() {
    await this.knex.createTableIfNotExists('web_user_map', table => {
      table.string('botId')
      table.string('visitorId')
      table.uuid('userId').unique()
      table.primary(['botId', 'visitorId'])
    })
  }

  //===================================
  // This section was copied in the
  // HITLNext module. Please make sure
  // to add your changes there too.
  //===================================

  async mapVisitor(botId: string, visitorId: string) {
    const userMapping = await this.getMappingFromVisitor(botId, visitorId)
    let userId = userMapping?.userId

    const createUserAndMapping = async () => {
      userId = (await this.bp.messaging.forBot(botId).createUser()).id
      await this.createUserMapping(botId, visitorId, userId)
    }

    if (!userMapping) {
      await createUserAndMapping()
    } else {
      // Prevents issues when switching between different Messaging servers
      // TODO: Remove this check once the 'web_user_map' table is removed
      if (!(await this.checkUserExist(botId, userMapping.userId))) {
        await this.deleteMappingFromVisitor(botId, visitorId)
        await createUserAndMapping()
      }
    }

    return userId
  }

  async getMappingFromVisitor(botId: string, visitorId: string): Promise<UserMapping | undefined> {
    const cached = this.cacheByVisitor.get(`${botId}_${visitorId}`)
    if (cached) {
      return cached
    }

    try {
      const rows = await this.knex('web_user_map').where({ botId, visitorId })

      if (rows?.length) {
        const mapping = rows[0] as UserMapping
        this.cacheByVisitor.set(`${botId}_${visitorId}`, mapping)
        return mapping
      }
    } catch (err) {
      this.bp.logger.error('An error occurred while fetching a visitor mapping.', err)

      return undefined
    }
  }

  async deleteMappingFromVisitor(botId: string, visitorId: string): Promise<void> {
    try {
      this.cacheByVisitor.del(`${botId}_${visitorId}`)
      await this.bp
        .database('web_user_map')
        .where({ botId, visitorId })
        .delete()
    } catch (err) {
      this.bp.logger.error('An error occurred while deleting a visitor mapping.', err)
    }
  }

  async getMappingFromUser(userId: string): Promise<UserMapping | undefined> {
    const cached = this.cacheByUser.get(userId)
    if (cached) {
      return cached
    }

    try {
      const rows = await this.knex('web_user_map').where({ userId })

      if (rows?.length) {
        const mapping = rows[0] as UserMapping
        this.cacheByUser.set(userId, mapping)
        return mapping
      }
    } catch (err) {
      this.bp.logger.error('An error occurred while fetching a user mapping.', err)

      return undefined
    }
  }

  async createUserMapping(botId: string, visitorId: string, userId: string): Promise<UserMapping> {
    const mapping = { botId, visitorId, userId }

    try {
      await this.knex('web_user_map').insert(mapping)
      this.cacheByVisitor.set(`${botId}_${visitorId}`, mapping)

      return mapping
    } catch (err) {
      this.bp.logger.error('An error occurred while creating a user mapping.', err)

      return undefined
    }
  }

  async getFeedbackInfoForMessageIds(_target: string, messageIds: string[]) {
    return this.knex('events')
      .select(['events.messageId', 'incomingEvents.feedback'])
      .innerJoin('events as incomingEvents', 'incomingEvents.id', 'events.incomingEventId')
      .whereIn('events.messageId', messageIds)
  }

  private async checkUserExist(botId: string, userId: string): Promise<boolean> {
    const user = await this.bp.messaging.forBot(botId).getUser(userId)

    return user?.id === userId
  }

  //===================================
  // End of copied section
  //===================================
}

export interface UserMapping {
  botId: string
  visitorId: string
  userId: string
}

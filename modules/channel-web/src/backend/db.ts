import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import LRUCache from 'lru-cache'
import ms from 'ms'
import { MessagingClient } from './messaging'

export default class WebchatDb {
  private readonly MAX_RETRY_ATTEMPTS = 3
  private knex: sdk.KnexExtended
  private users: typeof sdk.users
  private cacheByVisitor: LRUCache<string, UserMapping>
  private cacheByUser: LRUCache<string, UserMapping>
  private messagingClients: { [botId: string]: MessagingClient } = {}

  constructor(private bp: typeof sdk) {
    this.users = bp.users
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

  async mapVisitor(botId: string, visitorId: string, messaging: MessagingClient) {
    const userMapping = await this.getMappingFromVisitor(botId, visitorId)

    let userId: string

    if (!userMapping) {
      userId = (await messaging.createUser()).id
      await this.createUserMapping(botId, visitorId, userId)
    } else {
      userId = userMapping.userId
    }

    return userId
  }

  async getMappingFromVisitor(botId: string, visitorId: string): Promise<UserMapping | undefined> {
    const cached = this.cacheByVisitor.get(`${botId}_${visitorId}`)
    if (cached) {
      return cached
    }

    const rows = await this.knex('web_user_map').where({ visitorId })

    if (rows?.length) {
      const mapping = rows[0] as UserMapping
      this.cacheByVisitor.set(`${botId}_${visitorId}`, mapping)
      return mapping
    }

    return undefined
  }

  async getMappingFromUser(botId: string, userId: string): Promise<UserMapping | undefined> {
    const cached = this.cacheByUser.get(`${botId}_${userId}`)
    if (cached) {
      return cached
    }

    const rows = await this.knex('web_user_map').where({ userId })

    if (rows?.length) {
      const mapping = rows[0] as UserMapping
      this.cacheByUser.set(`${botId}_${userId}`, mapping)
      return mapping
    }

    return undefined
  }

  async createUserMapping(botId: string, visitorId: string, userId: string): Promise<UserMapping> {
    const mapping = { botId, visitorId, userId }

    await this.knex('web_user_map').insert(mapping)
    this.cacheByVisitor.set(`${botId}_${visitorId}`, mapping)

    return mapping
  }

  async getUserInfo(userId: string, user: sdk.User) {
    if (!user) {
      user = (await this.users.getOrCreateUser('web', userId)).result
    }

    let fullName = 'User'

    if (user && user.attributes) {
      const { first_name, last_name } = user.attributes

      if (first_name || last_name) {
        fullName = `${first_name || ''} ${last_name || ''}`.trim()
      }
    }

    return { fullName, avatar_url: _.get(user, 'attributes.picture_url') }
  }

  async getFeedbackInfoForMessageIds(target: string, messageIds: string[]) {
    return this.knex('events')
      .select(['events.messageId', 'incomingEvents.feedback'])
      .innerJoin('events as incomingEvents', 'incomingEvents.id', 'events.incomingEventId')
      .whereIn('events.messageId', messageIds)
  }

  getMessagingClient = async (botId: string) => {
    const client = this.messagingClients[botId]
    if (client) {
      return client
    }

    const { messaging } = await this.bp.bots.getBotById(botId)

    const botClient = new MessagingClient(
      `http://localhost:${process.MESSAGING_PORT}`,
      process.INTERNAL_PASSWORD,
      messaging.id,
      messaging.token,
      botId
    )
    this.messagingClients[botId] = botClient

    return botClient
  }
}

export interface UserMapping {
  botId: string
  visitorId: string
  userId: string
}

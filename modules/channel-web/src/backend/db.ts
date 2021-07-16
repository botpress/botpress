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
      table.string('visitorId').primary()
      table.uuid('userId').unique()
    })
  }

  async getMappingFromVisitor(visitorId: string): Promise<UserMapping | undefined> {
    const cached = this.cacheByVisitor.get(visitorId)
    if (cached) {
      return cached
    }

    const rows = await this.knex('web_user_map').where({ visitorId })

    if (rows?.length) {
      const mapping = rows[0] as UserMapping
      this.cacheByVisitor.set(visitorId, mapping)
      return mapping
    }

    return undefined
  }

  async getMappingFromUser(userId: string): Promise<UserMapping | undefined> {
    const cached = this.cacheByUser.get(userId)
    if (cached) {
      return cached
    }

    const rows = await this.knex('web_user_map').where({ userId })

    if (rows?.length) {
      const mapping = rows[0] as UserMapping
      this.cacheByUser.set(userId, mapping)
      return mapping
    }

    return undefined
  }

  async createUserMapping(visitorId: string, userId: string): Promise<UserMapping> {
    const mapping = { visitorId, userId }

    await this.knex('web_user_map').insert(mapping)
    this.cacheByVisitor.set(visitorId, mapping)

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
    const messageAndIncomingEventIds = await this.knex('events')
      .select(['messageId', 'incomingEventId'])
      .whereIn('messageId', messageIds)
      .andWhere({ target })

    const incomingEventIds = messageAndIncomingEventIds.map(x => x.incomingEventId)

    const incomingEventsFeedback = await this.knex('events')
      .select(['incomingEventId', 'feedback'])
      .whereIn('incomingEventId', incomingEventIds)
      .andWhere({ target, direction: 'incoming' })

    const infos = []
    for (const message of messageAndIncomingEventIds) {
      const incomingEvent = incomingEventsFeedback.find(x => x.incomingEventId === message.incomingEventId)
      if (incomingEvent) {
        infos.push({ messageId: message.messageId, feedback: incomingEvent.feedback })
      }
    }

    return infos
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
  visitorId: string
  userId: string
}

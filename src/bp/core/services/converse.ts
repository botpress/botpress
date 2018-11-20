import Bluebird from 'bluebird'
import Database from 'core/database'
import { UserRepository } from 'core/repositories'
import { TYPES } from 'core/types'
import { InvalidParameterError } from 'errors'
import { EventEmitter2 } from 'eventemitter2'
import { inject, injectable, postConstruct } from 'inversify'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'
import uuid from 'uuid'

import { Event } from '../sdk/impl'

import { EventEngine } from './middleware/event-engine'

export const converseEvents = new EventEmitter2({ maxListeners: 100 })

// FIXME: The content of this class was taken from the channel-web.
// Most of this code should exist in separate repos and used by this service.

@injectable()
export class ConverseService {
  responsesPerEvent: Map<string, object[]> = new Map()

  constructor(
    @inject(TYPES.Database) private db: Database,
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.UserRepository) private userRepository: UserRepository
  ) {}

  @postConstruct()
  init() {
    converseEvents.on('rendered', reponse => {
      const responses = this.responsesPerEvent[reponse.target]
      if (responses) {
        responses.push(reponse)
      } else {
        this.responsesPerEvent[reponse.target] = [reponse]
      }
    })
  }

  async sendMessage(botId: string, userId: string, payload): Promise<any> {
    if (!payload.text || !_.isString(payload.text) || payload.text.length > 360) {
      throw new InvalidParameterError('Text must be a valid string of less than 360 chars')
    }

    const sanitizedPayload = _.pick(payload, ['text', 'type', 'data', 'raw'])

    // We remove the password from the persisted messages for security reasons
    if (payload.type === 'login_prompt') {
      sanitizedPayload.data = _.omit(sanitizedPayload.data, ['password'])
    }

    if (payload.type === 'form') {
      sanitizedPayload.data.formId = payload.formId
    }

    const { result: user } = await this.userRepository.getOrCreate('api', userId)

    const incomingEvent = Event({
      type: 'text',
      channel: 'api',
      direction: 'incoming',
      payload,
      target: userId,
      botId
    })

    await this.eventEngine.sendEvent(incomingEvent)

    return new Promise(resolve => {
      converseEvents.on('done', res => {
        if (res.target === userId) {
          const result = this.responsesPerEvent[res.target]
          // this.responsesPerEvent[res.target] = {}
          return resolve(result)
        }
      })
    })
  }

  async getUserInfo(userId) {
    const { result: user } = await this.userRepository.getOrCreate('web', userId)

    const fullName = `${user.attributes['first_name']} ${user.attributes['last_name']}`
    const avatar = (user && user.attributes['picture_url']) || undefined

    return {
      fullName,
      avatar_url: avatar
    }
  }

  async initialize() {
    return this.db.knex
      .createTableIfNotExists('web_conversations', function(table) {
        table.increments('id').primary()
        table.string('userId')
        table.integer('botId')
        table.string('title')
        table.string('description')
        table.string('logo_url')
        table.timestamp('created_on')
        table.timestamp('last_heard_on') // The last time the user interacted with the bot. Used for "recent" conversation
        table.timestamp('user_last_seen_on')
        table.timestamp('bot_last_seen_on')
      })
      .then(() => {
        return this.db.knex.createTableIfNotExists('web_messages', function(table) {
          table.string('id').primary()
          table.integer('conversationId')
          table.string('userId')
          table.string('message_type')
          table.text('message_text')
          table.jsonb('message_raw')
          table.binary('message_data') // Only useful if type = file
          table.string('full_name')
          table.string('avatar_url')
          table.timestamp('sent_on')
        })
      })
  }

  async appendUserMessage(botId, userId, conversationId, { type, text, raw, data }) {
    const { fullName, avatar_url } = await this.getUserInfo(userId)

    const convo = await this.db
      .knex('web_conversations')
      .where({ userId, id: conversationId, botId })
      .select('id')
      .limit(1)
      .get(0)

    if (!convo) {
      throw new Error(`Conversation "${conversationId}" not found`)
    }

    const message = {
      id: uuid.v4(),
      conversationId,
      userId,
      full_name: fullName,
      avatar_url,
      message_type: type,
      message_text: text,
      message_raw: this.db.knex.json.set(raw),
      message_data: this.db.knex.json.set(data),
      sent_on: this.db.knex.date.now()
    }

    return Bluebird.join(
      this.db
        .knex('web_messages')
        .insert(message)
        .then(),

      this.db
        .knex('web_conversations')
        .where({ id: conversationId, userId: userId, botId: botId })
        .update({ last_heard_on: this.db.knex.date.now() })
        .then(),

      () => ({
        ...message,
        sent_on: new Date(),
        message_raw: raw,
        message_data: data
      })
    )
  }

  async appendBotMessage(botName, botAvatar, conversationId, { type, text, raw, data }) {
    const message = {
      id: uuid.v4(),
      conversationId: conversationId,
      userId: undefined,
      full_name: botName,
      avatar_url: botAvatar,
      message_type: type,
      message_text: text,
      message_raw: this.db.knex.json.set(raw),
      message_data: this.db.knex.json.set(data),
      sent_on: this.db.knex.date.now()
    }

    await this.db
      .knex('web_messages')
      .insert(message)
      .then()

    return Object.assign(message, {
      sent_on: new Date(),
      message_raw: this.db.knex.json.get(message.message_raw),
      message_data: this.db.knex.json.get(message.message_data)
    })
  }

  async createConversation(botId, userId, { originatesFromUserMessage = false } = {}) {
    const uid = Math.random()
      .toString()
      .substr(2, 6)
    const title = `Conversation ${uid}`

    await this.db
      .knex('web_conversations')
      .insert({
        botId,
        userId,
        created_on: this.db.knex.date.now(),
        last_heard_on: originatesFromUserMessage ? this.db.knex.date.now() : undefined,
        title
      })
      .then()

    const conversation = await this.db
      .knex('web_conversations')
      .where({ title, userId, botId })
      .select('id')
      .get(0)

    return conversation && conversation.id
  }

  async getOrCreateRecentConversation(botId: string, userId: string, { originatesFromUserMessage = false } = {}) {
    const recentCondition = this.db.knex.date.isAfter(
      'last_heard_on',
      moment()
        .subtract(ms(5000), 'ms')
        .toDate()
    )

    const conversation = await this.db
      .knex('web_conversations')
      .select('id')
      .whereNotNull('last_heard_on')
      .andWhere({ userId, botId })
      .andWhere(recentCondition)
      .orderBy('last_heard_on', 'desc')
      .limit(1)
      .get(0)

    return conversation ? conversation.id : this.createConversation(botId, userId, { originatesFromUserMessage })
  }

  async listConversations(userId: string, botId: string) {
    const conversations = (await this.db
      .knex('web_conversations')
      .select('id')
      .where({ userId, botId })
      .orderBy('last_heard_on', 'desc')
      .limit(100)
      .then()) as any[]

    const conversationIds = conversations.map(c => c.id)

    let lastMessages = this.db.knex
      .from('web_messages')
      .distinct(this.db.knex.raw('ON ("conversationId") *'))
      .orderBy('conversationId')
      .orderBy('sent_on', 'desc')

    if (this.db.knex.isLite) {
      const lastMessagesDate = this.db
        .knex('web_messages')
        .whereIn('conversationId', conversationIds)
        .groupBy('conversationId')
        .select(this.db.knex.raw('max(sent_on) as date'))

      lastMessages = this.db.knex
        .from('web_messages')
        .select('*')
        .whereIn('sent_on', lastMessagesDate)
    }

    return this.db.knex
      .from(function(this: any) {
        this.from('web_conversations')
          .where({ userId, botId })
          .as('wc')
      })
      .leftJoin(lastMessages.as('wm'), 'wm.conversationId', 'wc.id')
      .orderBy('wm.sent_on', 'desc')
      .select(
        'wc.id',
        'wc.title',
        'wc.description',
        'wc.logo_url',
        'wc.created_on',
        'wc.last_heard_on',
        'wm.message_type',
        'wm.message_text',
        this.db.knex.raw('wm.full_name as message_author'),
        this.db.knex.raw('wm.avatar_url as message_author_avatar'),
        this.db.knex.raw('wm.sent_on as message_sent_on')
      )
  }

  async getConversation(userId, conversationId, botId) {
    const condition: any = { userId, botId }

    if (conversationId && conversationId !== 'null') {
      condition.id = conversationId
    }

    const conversation = await this.db
      .knex('web_conversations')
      .where(condition)
      .get(0)

    if (!conversation) {
      return undefined
    }

    const messages = await this.getConversationMessages(conversationId)

    messages.forEach(m => {
      return Object.assign(m, {
        message_raw: this.db.knex.json.get(m.message_raw),
        message_data: this.db.knex.json.get(m.message_data)
      })
    })

    return Object.assign({}, conversation, {
      messages: _.orderBy(messages, ['sent_on'], ['asc'])
    })
  }

  getConversationMessages(conversationId, fromId?: string): PromiseLike<any> {
    let query = this.db.knex('web_messages').where({ conversationId: conversationId })

    if (fromId) {
      query = query.andWhere('id', '<', fromId)
    }

    return query
      .orderBy('sent_on', 'desc')
      .limit(20)
      .then()
  }
}

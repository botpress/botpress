import * as sdk from 'botpress/sdk'
import { Raw } from 'knex'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'
import uuid from 'uuid'

import { Config } from '../config'

import { DBMessage } from './typings'

export default class WebchatDb {
  private readonly MAX_RETRY_ATTEMPTS = 3
  private knex: sdk.KnexExtended
  private users: typeof sdk.users
  private batchedMessages: DBMessage[] = []
  private batchedConvos: Dic<Raw<any>> = {}
  private messagePromise: Promise<void | number[]>
  private convoPromise: Promise<void>
  private batchSize: number

  constructor(private bp: typeof sdk) {
    this.users = bp.users
    this.knex = bp['database'] // TODO Fixme

    this.batchSize = this.knex.isLite ? 40 : 2000

    setInterval(() => this.flush(), ms('1s'))
  }

  flush() {
    // tslint:disable-next-line: no-floating-promises
    this.flushMessages()
    // tslint:disable-next-line: no-floating-promises
    this.flushConvoUpdates()
  }

  async flushMessages() {
    if (this.messagePromise || !this.batchedMessages.length) {
      return
    }

    const batchCount = this.batchedMessages.length >= this.batchSize ? this.batchSize : this.batchedMessages.length
    const elements = this.batchedMessages.splice(0, batchCount)

    this.messagePromise = this.knex
      .batchInsert(
        'web_messages',
        elements.map(x => _.omit(x, 'retry')),
        this.batchSize
      )
      .catch(err => {
        this.bp.logger.attachError(err).error("Couldn't store messages to the database. Re-queuing elements")
        const elementsToRetry = elements
          .map(x => ({ ...x, retry: x.retry ? x.retry + 1 : 1 }))
          .filter(x => x.retry < this.MAX_RETRY_ATTEMPTS)
        this.batchedMessages.push(...elementsToRetry)
      })
      .finally(() => {
        this.messagePromise = undefined
      })
  }

  async flushConvoUpdates() {
    if (this.convoPromise || !Object.keys(this.batchedConvos).length) {
      return
    }

    this.convoPromise = this.knex
      .transaction(async trx => {
        const queries = []

        for (const key in this.batchedConvos) {
          const [conversationId, userId, botId] = key.split('_')
          const value = this.batchedConvos[key]

          const query = this.knex('web_conversations')
            .where({ id: conversationId, userId, botId })
            .update({ last_heard_on: value })
            .transacting(trx)

          queries.push(query)
        }

        this.batchedConvos = {}

        await Promise.all(queries)
          .then(trx.commit)
          .catch(trx.rollback)
      })
      .finally(() => {
        this.convoPromise = undefined
      })
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

  async initialize() {
    return this.knex
      .createTableIfNotExists('web_conversations', function(table) {
        table.increments('id').primary()
        table.string('userId')
        table.string('botId')
        table.string('title')
        table.string('description')
        table.string('logo_url')
        table.timestamp('created_on')
        table.timestamp('last_heard_on') // The last time the user interacted with the bot. Used for "recent" conversation
        table.timestamp('user_last_seen_on')
        table.timestamp('bot_last_seen_on')
        table.index(['userId', 'botId'], 'wcub_idx')
      })
      .then(() => {
        return this.knex.createTableIfNotExists('web_messages', function(table) {
          table.string('id').primary()
          table.integer('conversationId')
          table.string('incomingEventId')
          table.string('eventId')
          table.string('userId')
          table.string('message_type') // @ deprecated Remove in a future release (11.9)
          table.text('message_text') // @ deprecated Remove in a future release (11.9)
          table.jsonb('message_raw') // @ deprecated Remove in a future release (11.9)
          table.jsonb('message_data') // @ deprecated Remove in a future release (11.9)
          table.jsonb('payload')
          table.string('full_name')
          table.string('avatar_url')
          table.timestamp('sent_on')
          table.index(['conversationId', 'sent_on'], 'wmcs_idx')
        })
      })
      .then(() => {
        // Index creation with where condition is unsupported by knex
        return this.knex.raw(
          `CREATE INDEX IF NOT EXISTS wmcms_idx ON web_messages ("conversationId", message_type, sent_on DESC) WHERE message_type != 'visit';`
        )
      })
  }

  async appendUserMessage(
    botId: string,
    userId: string,
    conversationId: number,
    payload: any,
    eventId: string,
    user?: sdk.User
  ) {
    const { fullName, avatar_url } = await this.getUserInfo(userId, user)
    const { type, text, raw, data } = payload

    const now = new Date()
    const message: DBMessage = {
      id: uuid.v4(),
      conversationId,
      eventId,
      incomingEventId: eventId,
      userId,
      full_name: fullName,
      avatar_url,
      message_type: type,
      message_text: text,
      message_raw: this.knex.json.set(raw),
      message_data: this.knex.json.set(data),
      payload: this.knex.json.set(payload),
      sent_on: this.knex.date.format(now)
    }

    this.batchedMessages.push(message)
    this.batchedConvos[`${conversationId}_${userId}_${botId}`] = this.knex.date.format(now)

    return {
      ...message,
      sent_on: now,
      message_raw: raw,
      message_data: data,
      payload
    }
  }

  async appendBotMessage(
    botName: string,
    botAvatar: string,
    conversationId: number,
    payload: any,
    incomingEventId: string,
    eventId: string
  ) {
    const { type, text, raw, data } = payload

    const now = new Date()
    const message: DBMessage = {
      id: uuid.v4(),
      conversationId,
      eventId,
      incomingEventId,
      userId: undefined,
      full_name: botName,
      avatar_url: botAvatar,
      message_type: type,
      message_text: text,
      message_raw: this.knex.json.set(raw),
      message_data: this.knex.json.set(data),
      payload: this.knex.json.set(payload),
      sent_on: this.knex.date.format(now)
    }

    this.batchedMessages.push(message)

    return {
      ...message,
      sent_on: now,
      message_raw: raw,
      message_data: data,
      payload
    }
  }

  async createConversation(botId, userId, { originatesFromUserMessage = false } = {}) {
    const uid = Math.random()
      .toString()
      .substr(2, 6)
    const title = `Conversation ${uid}`

    await this.knex('web_conversations')
      .insert({
        botId,
        userId,
        created_on: this.knex.date.now(),
        last_heard_on: originatesFromUserMessage ? this.knex.date.now() : undefined,
        title
      })
      .then()

    const conversation = await this.knex('web_conversations')
      .where({ title, userId, botId })
      .select('id')
      .then()
      .get(0)

    return conversation && conversation.id
  }

  async getOrCreateRecentConversation(botId: string, userId: string, { originatesFromUserMessage = false } = {}) {
    // TODO: Lifetime config by bot
    const config = await this.bp.config.getModuleConfigForBot('channel-web', botId)

    const recentCondition = this.knex.date.isAfter(
      'last_heard_on',
      moment()
        .subtract(ms(config.recentConversationLifetime), 'ms')
        .toDate()
    )

    const conversation = await this.knex('web_conversations')
      .select('id')
      .whereNotNull('last_heard_on')
      .andWhere({ userId, botId })
      .andWhere(recentCondition)
      .orderBy('last_heard_on', 'desc')
      .limit(1)
      .then()
      .get(0)

    return conversation ? conversation.id : this.createConversation(botId, userId, { originatesFromUserMessage })
  }

  async listConversations(userId: string, botId: string) {
    const conversations = (await this.knex('web_conversations')
      .select('id')
      .where({ userId, botId })
      .orderBy('last_heard_on', 'desc')
      .limit(100)
      .then()) as any[]

    const conversationIds = conversations.map(c => c.id)

    let lastMessages: any = this.knex
      .from('web_messages')
      .distinct(
        this.knex.raw(
          'ON ("conversationId") message_type, message_text, full_name, avatar_url, sent_on, "conversationId"'
        )
      )
      .whereIn('conversationId', conversationIds)
      .orderBy('conversationId')
      .orderBy('sent_on', 'desc')

    if (this.knex.isLite) {
      const lastMessagesDate = this.knex('web_messages')
        .whereIn('conversationId', conversationIds)
        .groupBy('conversationId')
        .select(this.knex.raw('max(sent_on) as date'))

      lastMessages = this.knex
        .from('web_messages')
        .select('*')
        .whereIn('sent_on', lastMessagesDate)
    }

    return this.knex
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
        this.knex.raw('wm.full_name as message_author'),
        this.knex.raw('wm.avatar_url as message_author_avatar'),
        this.knex.raw('wm.sent_on as message_sent_on')
      )
  }

  async getConversation(userId, conversationId, botId) {
    const config = (await this.bp.config.getModuleConfigForBot('channel-web', botId)) as Config
    const condition: any = { userId, botId }

    if (conversationId && conversationId !== 'null') {
      condition.id = conversationId
    }

    const conversation = await this.knex('web_conversations')
      .where(condition)
      .then()
      .get(0)

    if (!conversation) {
      return undefined
    }

    const messages = await this.getConversationMessages(conversationId, config.maxMessagesHistory)

    messages.forEach(m => {
      return Object.assign(m, {
        message_raw: this.knex.json.get(m.message_raw),
        message_data: this.knex.json.get(m.message_data),
        payload: this.knex.json.get(m.payload)
      })
    })

    return Object.assign({}, conversation, {
      messages: _.orderBy(messages, ['sent_on'], ['asc'])
    })
  }

  async getConversationMessages(conversationId, limit: number, fromId?: string): Promise<any> {
    let query = this.knex('web_messages').where({ conversationId })

    if (fromId) {
      query = query.andWhere('id', '<', fromId)
    }

    return query
      .whereNot({ message_type: 'visit' })
      .orderBy('sent_on', 'desc')
      .limit(limit)
  }

  async getFeedbackInfoForEventIds(target: string, eventIds: string[]) {
    return this.knex('events')
      .select(['incomingEventId', 'feedback'])
      .whereIn('incomingEventId', eventIds)
      .andWhere({ target, direction: 'incoming' })
  }
}

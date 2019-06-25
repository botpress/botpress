import Bluebird from 'bluebird'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'
import uuid from 'uuid'

import { Config } from '../config'

export default class WebchatDb {
  knex: any
  users: typeof sdk.users

  constructor(private bp: typeof sdk) {
    this.users = bp.users
    this.knex = bp['database'] // TODO Fixme
  }

  async getUserInfo(userId) {
    const { result: user } = await this.users.getOrCreateUser('web', userId)

    const fullName = `${user.attributes['first_name']} ${user.attributes['last_name']}`
    const avatar = (user && user.attributes['picture_url']) || undefined

    return {
      fullName,
      avatar_url: avatar
    }
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
      })
      .then(() => {
        return this.knex.createTableIfNotExists('web_messages', function(table) {
          table.string('id').primary()
          table.integer('conversationId')
          table.string('incomingEventId')
          table.string('userId')
          table.string('message_type') // @ deprecated Remove in a future release (11.9)
          table.text('message_text') // @ deprecated Remove in a future release (11.9)
          table.jsonb('message_raw') // @ deprecated Remove in a future release (11.9)
          table.jsonb('message_data') // @ deprecated Remove in a future release (11.9)
          table.jsonb('payload')
          table.string('full_name')
          table.string('avatar_url')
          table.timestamp('sent_on')
        })
      })
      .then(() =>
        this.knex('web_messages')
          .columnInfo()
          .then(info => {
            if (info.payload === undefined) {
              return this.knex.schema.alterTable('web_messages', table => {
                table.jsonb('payload')
              })
            }
          })
      )
  }

  async appendUserMessage(botId, userId, conversationId, payload, incomingEventId) {
    const { fullName, avatar_url } = await this.getUserInfo(userId)
    const { type, text, raw, data } = payload

    const convo = await this.knex('web_conversations')
      .where({ userId, id: conversationId, botId })
      .select('id')
      .limit(1)
      .then()
      .get(0)

    if (!convo) {
      throw new Error(`Conversation "${conversationId}" not found - BP_CONV_NOT_FOUND`)
    }

    const message = {
      id: uuid.v4(),
      conversationId,
      incomingEventId,
      userId,
      full_name: fullName,
      avatar_url,
      message_type: type,
      message_text: text,
      message_raw: this.knex.json.set(raw),
      message_data: this.knex.json.set(data),
      payload: this.knex.json.set(payload),
      sent_on: this.knex.date.now()
    }

    return Bluebird.join(
      this.knex('web_messages')
        .insert(message)
        .then(),

      this.knex('web_conversations')
        .where({ id: conversationId, userId: userId, botId: botId })
        .update({ last_heard_on: this.knex.date.now() })
        .then(),

      () => ({
        ...message,
        sent_on: new Date(),
        message_raw: raw,
        message_data: data,
        payload: payload
      })
    )
  }

  async appendBotMessage(botName, botAvatar, conversationId, payload, incomingEventId) {
    const { type, text, raw, data } = payload
    const message = {
      id: uuid.v4(),
      conversationId: conversationId,
      incomingEventId,
      userId: undefined,
      full_name: botName,
      avatar_url: botAvatar,
      message_type: type,
      message_text: text,
      message_raw: this.knex.json.set(raw),
      message_data: this.knex.json.set(data),
      payload: this.knex.json.set(payload),
      sent_on: this.knex.date.now()
    }

    await this.knex('web_messages')
      .insert(message)
      .then()

    return Object.assign(message, {
      sent_on: new Date(),
      message_raw: this.knex.json.get(message.message_raw),
      message_data: this.knex.json.get(message.message_data),
      payload: this.knex.json.get(message.payload)
    })
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

    let lastMessages = this.knex
      .from('web_messages')
      .distinct(this.knex.raw('ON ("conversationId") *'))
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
    let query = this.knex('web_messages').where({ conversationId: conversationId })

    if (fromId) {
      query = query.andWhere('id', '<', fromId)
    }

    return query
      .whereNot({ message_type: 'visit' })
      .orderBy('sent_on', 'desc')
      .limit(limit)
  }
}

import * as sdk from 'botpress/sdk'
import Database from 'core/database'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import _ from 'lodash'
import moment from 'moment'
import ms from 'ms'
import uuid from 'uuid'

const conversationsTable = 'web_conversations'
const messageTable = 'web_messages'

@injectable()
export class ConversationsRepository {
  constructor(@inject(TYPES.Database) private database: Database) {}

  async getOrCreateConversation(
    botId: string,
    userId: string,
    opt: { lifetime?: string; isUserCreated?: boolean } = { lifetime: '6 hours', isUserCreated: false }
  ): Promise<any> {
    const recentCondition = this.database.knex.date.isAfter(
      'last_heard_on',
      moment()
        .subtract(ms(opt.lifetime), 'ms')
        .toDate()
    )

    const conversation = await this.database
      .knex(conversationsTable)
      .select('id')
      .whereNotNull('last_heard_on')
      .andWhere({ userId, botId })
      .andWhere(recentCondition)
      .orderBy('last_heard_on', 'desc')
      .limit(1)
      .get(0)

    return conversation ? conversation['id'] : this.createConversation(botId, userId, opt.isUserCreated)
  }

  async createConversation(botId: string, userId: string, isCreatedByUser = false): Promise<any> {
    const uid = Math.random()
      .toString()
      .substr(2, 6)
    const title = `Conversation ${uid}`

    await this.database.knex(conversationsTable).insert({
      botId,
      userId,
      created_on: this.database.knex.date.now(),
      last_heard_on: isCreatedByUser ? this.database.knex.date.now() : undefined,
      title
    })

    const conversation = await this.database
      .knex(conversationsTable)
      .where({ title, userId, botId })
      .select('id')
      .get(0)

    return conversation && conversation['id']
  }

  async appendUserMessage(
    botId: string,
    userId: string,
    conversationId: string,
    fullName: string,
    avatarUrl: string,
    payload: sdk.conversations.MessagePayload
  ) {
    const convo = await this.database
      .knex(conversationsTable)
      .where({ userId, id: conversationId, botId })
      .select('id')
      .limit(1)
      .get(0)

    if (!convo) {
      throw new Error(`Conversation "${conversationId}" not found`)
    }

    const { type, text, raw, data } = payload

    const message = {
      id: uuid.v4(),
      conversationId,
      userId,
      full_name: fullName,
      avatar_url: avatarUrl,
      message_type: type,
      message_text: text,
      message_raw: this.database.knex.json.set(raw),
      message_data: this.database.knex.json.set(data),
      sent_on: this.database.knex.date.now()
    }

    return Promise.join(
      this.database.knex(messageTable).insert(message),
      this.database
        .knex(conversationsTable)
        .where({ id: conversationId, userId: userId, botId: botId })
        .update({ last_heard_on: this.database.knex.date.now() }),
      () => ({
        ...message,
        sent_on: new Date(),
        message_raw: raw,
        message_data: data
      })
    )
  }

  async appendBotMessage(
    botName: string,
    botAvatar: string,
    conversationId: string,
    payload: sdk.conversations.MessagePayload
  ): Promise<any> {
    const { type, text, raw, data } = payload
    const message = {
      id: uuid.v4(),
      conversationId: conversationId,
      userId: undefined,
      full_name: botName,
      avatar_url: botAvatar,
      message_type: type,
      message_text: text,
      message_raw: this.database.knex.json.set(raw),
      message_data: this.database.knex.json.set(data),
      sent_on: this.database.knex.date.now()
    }

    await this.database.knex(messageTable).insert(message)

    return Object.assign(message, {
      sent_on: new Date(),
      message_raw: this.database.knex.json.get(message.message_raw),
      message_data: this.database.knex.json.get(message.message_data)
    })
  }

  async listConversations(userId: string, botId: string) {
    const conversations = (await this.database
      .knex(conversationsTable)
      .select('id')
      .where({ userId, botId })
      .orderBy('last_heard_on', 'desc')
      .limit(100)
      .then()) as any[]

    const conversationIds = conversations.map(c => c.id)

    let lastMessages = this.database.knex
      .from(messageTable)
      .distinct(this.database.knex.raw('ON ("conversationId") *'))
      .orderBy('conversationId')
      .orderBy('sent_on', 'desc')

    if (this.database.knex.isLite) {
      const lastMessagesDate = this.database
        .knex(messageTable)
        .whereIn('conversationId', conversationIds)
        .groupBy('conversationId')
        .select(this.database.knex.raw('max(sent_on) as date'))

      lastMessages = this.database.knex
        .from(messageTable)
        .select('*')
        .whereIn('sent_on', lastMessagesDate)
    }

    return this.database.knex
      .from(function(this: any) {
        this.from(conversationsTable)
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
        this.database.knex.raw('wm.full_name as message_author'),
        this.database.knex.raw('wm.avatar_url as message_author_avatar'),
        this.database.knex.raw('wm.sent_on as message_sent_on')
      )
  }

  async getConversation(userId: string, conversationId: string, botId: string) {
    const condition: any = { userId, botId }

    if (conversationId && conversationId !== 'null') {
      condition.id = conversationId
    }

    const conversation = await this.database
      .knex(conversationsTable)
      .where(condition)
      .get(0)

    if (!conversation) {
      return undefined
    }

    const messages = await this.getConversationMessages(conversationId)

    messages.forEach(m => {
      return Object.assign(m, {
        message_raw: this.database.knex.json.get(m.message_raw),
        message_data: this.database.knex.json.get(m.message_data)
      })
    })

    return Object.assign({}, conversation, {
      messages: _.orderBy(messages, ['sent_on'], ['asc'])
    })
  }

  getConversationMessages(conversationId: string, fromId?: string): PromiseLike<any> {
    let query = this.database.knex(messageTable).where({ conversationId: conversationId })

    if (fromId) {
      query = query.andWhere('id', '<', fromId)
    }

    return query
      .whereNot({ message_type: 'visit' })
      .orderBy('sent_on', 'desc')
      .limit(20)
  }
}

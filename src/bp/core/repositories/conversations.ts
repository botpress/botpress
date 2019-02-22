import * as sdk from 'botpress/sdk'
import Database from 'core/database'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'
import moment from 'moment'
import ms from 'ms'
import uuid from 'uuid'

@injectable()
export class ConversationsRepository {
  private readonly conversationTable = 'web_conversations'
  private readonly messageTable = 'web_messages'

  constructor(@inject(TYPES.Database) private database: Database) {}

  async getOrCreate(botId: string, userId: string, lifetime: string): Promise<any> {
    const recentCondition = this.database.knex.date.isAfter(
      'last_heard_on',
      moment()
        .subtract(ms(lifetime), 'ms')
        .toDate()
    )

    const conversation = await this.database
      .knex(this.conversationTable)
      .select('id')
      .whereNotNull('last_heard_on')
      .andWhere({ userId, botId })
      .andWhere(recentCondition)
      .orderBy('last_heard_on', 'desc')
      .limit(1)
      .get(0)

    return conversation ? conversation['id'] : this.create(botId, userId, { originatesFromUserMessage: true })
  }

  async create(botId: string, userId: string, { originatesFromUserMessage = false } = {}): Promise<any> {
    const uid = Math.random()
      .toString()
      .substr(2, 6)
    const title = `Conversation ${uid}`

    await this.database.knex(this.conversationTable).insert({
      botId,
      userId,
      created_on: this.database.knex.date.now(),
      last_heard_on: originatesFromUserMessage ? this.database.knex.date.now() : undefined,
      title
    })

    const conversation = await this.database
      .knex(this.conversationTable)
      .where({ title, userId, botId })
      .select('id')
      .get(0)

    return conversation && conversation['id']
  }

  async appendUserMessage(
    botId,
    userId,
    conversationId,
    fullName,
    avatarUrl,
    payload: sdk.conversations.MessagePayload
  ) {
    const convo = await this.database
      .knex(this.conversationTable)
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
      this.database.knex(this.messageTable).insert(message),
      this.database
        .knex(this.conversationTable)
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

  async appendBotMessage(botName, botAvatar, conversationId, payload: sdk.conversations.MessagePayload): Promise<any> {
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

    await this.database.knex(this.messageTable).insert(message)

    return Object.assign(message, {
      sent_on: new Date(),
      message_raw: this.database.knex.json.get(message.message_raw),
      message_data: this.database.knex.json.get(message.message_data)
    })
  }
}

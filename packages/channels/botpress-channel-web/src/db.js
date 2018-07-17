import moment from 'moment'
import Promise from 'bluebird'
import _ from 'lodash'
import uuid from 'uuid'
import ms from 'ms'

import { DatabaseHelpers as helpers } from 'botpress'

import { sanitizeUserId } from './util'

// TODO make these vars configurable
const RECENT_CONVERSATION_LIFETIME = ms('6 hours')
const RECENT_CONVERSATIONS_LIMIT = 100

module.exports = knex => {
  async function getUserInfo(userId) {
    const user = await knex('users')
      .where({ platform: 'webchat', userId: sanitizeUserId(userId) })
      .then()
      .get(0)
    const name = user && `${user.first_name} ${user.last_name}`
    const avatar = (user && user.picture_url) || null

    return {
      fullName: name,
      avatar_url: avatar
    }
  }

  function initialize() {
    if (!knex) {
      throw new Error('you must initialize the database before')
    }

    const createIndex = (tableName, ...index) =>
      knex.schema
        .alterTable(tableName, table => {
          table.index(...index)
        })
        .catch(err => {
          if (err.message.includes('already exists')) {
            return
          }
          throw err
        })

    return helpers(knex)
      .createTableIfNotExists('web_conversations', table => {
        table.increments('id').primary()
        table.string('userId')
        table.string('title')
        table.string('description')
        table.string('logo_url')
        table.timestamp('created_on')
        table.timestamp('last_heard_on') // The last time the user interacted with the bot. Used for "recent" conversation
        table.timestamp('user_last_seen_on')
        table.timestamp('bot_last_seen_on')
      })
      .then(() => createIndex('web_conversations', 'userId'))
      .then(() => createIndex('web_conversations', ['id', 'userId']))
      .then(() => createIndex('web_conversations', ['userId', knex.raw('last_heard_on DESC')]))
      .then(() =>
        helpers(knex).createTableIfNotExists('web_messages', table => {
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
      )
  }

  async function appendUserMessage(userId, conversationId, { type, text, raw, data }) {
    userId = sanitizeUserId(userId)

    const convo = await knex('web_conversations')
      .where({ id: conversationId, userId })
      .select('id')
      .limit(1)
      .then()
      .get(0)

    if (!convo) {
      throw new Error(`Conversation "${conversationId}" not found`)
    }

    const { fullName, avatar_url } = await getUserInfo(userId)

    const message = {
      id: uuid.v4(),
      conversationId,
      userId,
      full_name: fullName,
      avatar_url,
      message_type: type,
      message_text: text,
      message_raw: helpers(knex).json.set(raw),
      message_data: helpers(knex).json.set(data),
      sent_on: helpers(knex).date.now()
    }

    return Promise.join(
      knex('web_messages')
        .insert(message)
        .then(),

      knex('web_conversations')
        .where({ id: conversationId, userId })
        .update({ last_heard_on: helpers(knex).date.now() })
        .then(),

      () => ({
        ...message,
        sent_on: new Date(),
        message_raw: raw,
        message_data: data
      })
    )
  }

  async function appendBotMessage(botName, botAvatar, conversationId, { type, text, raw, data }) {
    const message = {
      id: uuid.v4(),
      conversationId: conversationId,
      userId: null,
      full_name: botName,
      avatar_url: botAvatar,
      message_type: type,
      message_text: text,
      message_raw: helpers(knex).json.set(raw),
      message_data: helpers(knex).json.set(data),
      sent_on: helpers(knex).date.now()
    }

    await knex('web_messages')
      .insert(message)
      .then()

    return {
      ...message,
      sent_on: new Date(),
      message_raw: raw,
      message_data: data
    }
  }

  const createConversation = userId => {
    const uid = Math.random()
      .toString()
      .substr(2, 6)
    const title = `Conversation ${uid}`

    return helpers(knex).insertAndRetrieve('web_conversations', {
      userId: sanitizeUserId(userId),
      created_on: helpers(knex).date.now(),
      last_heard_on: helpers(knex).date.now(),
      title
    })
  }

  async function patchConversation(userId, conversationId, title, description, logoUrl) {
    userId = sanitizeUserId(userId)

    await knex('web_conversations')
      .where({ id: conversationId, userId })
      .update({
        title,
        description,
        logo_url: logoUrl
      })
      .then()
  }

  async function getOrCreateRecentConversation(userId) {
    userId = sanitizeUserId(userId)

    const conversation = await knex('web_conversations')
      .select('id', 'last_heard_on')
      .where({ userId })
      .orderBy('last_heard_on', 'desc')
      .limit(1)
      .then()
      .get(0)

    if (
      conversation &&
      moment(conversation.last_heard_on)
        .add(RECENT_CONVERSATION_LIFETIME, 'ms')
        .isAfter(/* no arg = now */)
    ) {
      return conversation.id
    }

    return createConversation(userId)
  }

  async function listConversations(userId) {
    userId = sanitizeUserId(userId)

    const conversations = await knex('web_conversations')
      .select('id', 'title', 'description', 'logo_url', 'created_on')
      .where({ userId })
      .orderBy('last_heard_on', 'desc')
      .limit(RECENT_CONVERSATIONS_LIMIT)
      .then()

    const conversationIds = conversations.map(c => c.id)
    const conversationById = _.keyBy(conversations, 'id')

    const messages = await knex
      .from(function() {
        this.from('web_messages')
          .whereIn('conversationId', conversationIds)
          .groupBy('conversationId')
          .select('conversationId', knex.raw('max(id) as msgid'))
          .as('q1')
      })
      .leftJoin('web_messages', 'web_messages.id', 'q1.msgid')
      .orderBy('web_messages.sent_on', 'desc')
      .select(
        knex.raw('"q1"."conversationId" as id'),
        'web_messages.message_type',
        'web_messages.message_text',
        knex.raw('web_messages.full_name as message_author'),
        knex.raw('web_messages.avatar_url as message_author_avatar'),
        knex.raw('web_messages.sent_on as message_sent_on')
      )
      .then()

    messages.forEach(message => {
      Object.assign(message, conversationById[message.id])
    })

    return messages
  }

  async function getConversation(userId, conversationId, fromId = null) {
    userId = sanitizeUserId(userId)

    const condition = { userId }

    if (conversationId && conversationId !== 'null') {
      condition.id = conversationId
    }

    const conversation = await knex('web_conversations')
      .where(condition)
      .then()
      .get(0)

    if (!conversation) {
      return null
    }

    const messages = await getConversationMessages(conversationId, fromId)
    const h = helpers(knex)

    messages.forEach(m => {
      Object.assign(m, {
        message_raw: h.json.get(m.message_raw),
        message_data: h.json.get(m.message_data)
      })
    })

    return Object.assign({}, conversation, {
      messages: _.orderBy(messages, ['sent_on'], ['asc'])
    })
  }

  function getConversationMessages(conversationId, fromId = null) {
    let query = knex('web_messages').where({ conversationId: conversationId })

    if (fromId) {
      query = query.andWhere('id', '<', fromId)
    }

    return query
      .orderBy('sent_on', 'desc')
      .limit(20)
      .then()
  }

  return {
    initialize,
    appendUserMessage,
    appendBotMessage,
    createConversation,
    patchConversation,
    getConversation,
    listConversations,
    getOrCreateRecentConversation
  }
}

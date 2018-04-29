import moment from 'moment'
import _ from 'lodash'
import uuid from 'uuid'

import { DatabaseHelpers as helpers } from 'botpress'

import { sanitizeUserId } from './util'

module.exports = knex => {
  async function getUserInfo(userId) {
    const user = await knex('users')
      .where({ platform: 'webchat', userId: sanitizeUserId(userId) })
      .then()
      .get(0)
      .then()
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

    return helpers(knex)
      .createTableIfNotExists('web_conversations', function(table) {
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
      .then(function() {
        return helpers(knex).createTableIfNotExists('web_messages', function(table) {
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

  async function appendUserMessage(userId, conversationId, { type, text, raw, data }) {
    userId = sanitizeUserId(userId)

    const { fullName, avatar_url } = await getUserInfo(userId)

    const convo = await getConversation(userId, conversationId)

    if (!convo) {
      throw new Error(`Conversation "${conversationId}" not found`)
    }

    const message = {
      id: uuid.v4(),
      conversationId: conversationId,
      userId: userId,
      full_name: fullName,
      avatar_url,
      message_type: type,
      message_text: text,
      message_raw: helpers(knex).json.set(raw),
      message_data: helpers(knex).json.set(data),
      sent_on: helpers(knex).date.now()
    }

    await knex('web_messages')
      .insert(message)
      .then()

    await knex('web_conversations')
      .where({ id: conversationId, userId: userId })
      .update({ last_heard_on: helpers(knex).date.now() })
      .then()

    return Object.assign(message, {
      sent_on: new Date(),
      message_raw: helpers(knex).json.get(message.message_raw),
      message_data: helpers(knex).json.get(message.message_data)
    })
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

    return Object.assign(message, {
      sent_on: new Date(),
      message_raw: helpers(knex).json.get(message.message_raw),
      message_data: helpers(knex).json.get(message.message_data)
    })
  }

  async function createConversation(userId) {
    userId = sanitizeUserId(userId)

    const uid = Math.random()
      .toString()
      .substr(2, 6)
    const title = `Conversation ${uid}`

    await knex('web_conversations')
      .insert({
        userId,
        created_on: helpers(knex).date.now(),
        title
      })
      .then()

    const conversation = await knex('web_conversations')
      .where({ title, userId })
      .select('id')
      .then()
      .get(0)
      .then()

    return conversation && conversation.id
  }

  async function patchConversation(userId, conversationId, title, description, logoUrl) {
    userId = sanitizeUserId(userId)

    await knex('web_conversations')
      .where({ userId, id: conversationId })
      .update({
        title,
        description,
        logo_url: logoUrl
      })
      .then()
  }

  async function getOrCreateRecentConversation(userId) {
    userId = sanitizeUserId(userId)

    const conversations = await listConversations(userId)

    // TODO make this configurable
    const isRecent = d => {
      const then = moment(d)
      const recent = moment().subtract(6, 'hours')
      return then.isSameOrAfter(recent)
    }

    let recents = _.filter(conversations, c => isRecent(c.last_heard_on))
    recents = _.orderBy(recents, ['last_heard_on'], ['desc'])

    if (recents.length) {
      return recents[0].id
    }

    return createConversation(userId)
  }

  async function listConversations(userId) {
    userId = sanitizeUserId(userId)

    const conversations = await knex('web_conversations')
      .where({ userId })
      .orderBy(['last_heard_on'], 'desc')
      .limit(100)
      .then()

    const conversationIds = _.map(conversations, c => c.id)

    return knex
      .from(function() {
        this.from('web_messages')
          .whereIn('conversationId', conversationIds)
          .groupBy('conversationId')
          .select('conversationId', knex.raw('max(id) as msgid'))
          .as('q1')
      })
      .innerJoin('web_conversations', 'web_conversations.id', 'q1.conversationId')
      .innerJoin('web_messages', 'web_messages.id', 'q1.msgid')
      .orderBy('web_messages.sent_on', 'desc')
      .select(
        'web_conversations.id',
        'web_conversations.title',
        'web_conversations.description',
        'web_conversations.logo_url',
        'web_conversations.created_on',
        'web_messages.message_type',
        'web_messages.message_text',
        knex.raw('web_messages.full_name as message_author'),
        knex.raw('web_messages.avatar_url as message_author_avatar'),
        knex.raw('web_messages.sent_on as message_sent_on')
      )
      .then()
  }

  async function getConversation(userId, conversationId, fromId = null) {
    userId = sanitizeUserId(userId)

    const condition = { userId: userId }

    if (conversationId && conversationId !== 'null') {
      condition.id = conversationId
    }

    const conversation = await knex('web_conversations')
      .where(condition)
      .then()
      .get(0)
      .then()

    if (!conversation) {
      return null
    }

    const messages = await getConversationMessages(conversationId, fromId)

    messages.forEach(m => {
      return Object.assign(m, {
        message_raw: helpers(knex).json.get(m.message_raw),
        message_data: helpers(knex).json.get(m.message_data)
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

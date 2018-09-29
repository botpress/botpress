import moment from 'moment'
import Promise from 'bluebird'
import { orderBy, keyBy, throttle, memoize } from 'lodash'
import uuid from 'uuid'
import ms from 'ms'
import LRU from 'lru-cache'

import { DatabaseHelpers as helpers } from 'botpress'

import { sanitizeUserId } from './util'

const userInitiatedMessageTypes = ['message', 'text', 'image', 'login_prompt', 'quick_reply', 'form', 'file', 'video']

module.exports = (knex, config) => {
  const RECENT_CONVERSATION_LIFETIME = ms(config.recentConversationLifetime)
  // TODO make these vars configurable?
  const RECENT_CONVERSATIONS_LIMIT = 100
  const USER_INFO_CACHE_TTL = ms('1 minute')
  const USER_INFO_CACHE_SIZE = 1000
  const KNOWN_CONVOS_CACHE_SIZE = 1000

  const h = helpers(knex)
  const isLite = () => h.isLite()

  const userInfoCache = LRU({
    maxAge: USER_INFO_CACHE_TTL,
    max: USER_INFO_CACHE_SIZE
  })

  const knownConvosCache = LRU(KNOWN_CONVOS_CACHE_SIZE)

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

    return h
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
        h.createTableIfNotExists('web_messages', table => {
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

  async function checkConversation(conversationId, userId) {
    const knownUserId = knownConvosCache.get(conversationId)
    if (knownUserId === userId) {
      return
    } else if (knownUserId && knownUserId !== userId) {
      throw new Error(`Conversation "${conversationId}" not found`)
    }

    const convo = await knex('web_conversations')
      .where({ id: conversationId, userId })
      .select('id')
      .limit(1)
      .then()
      .get(0)

    if (!convo) {
      throw new Error(`Conversation "${conversationId}" not found`)
    }

    knownConvosCache.set(conversationId, userId)
  }

  async function getUserInfo(userId) {
    userId = sanitizeUserId(userId)

    let res = userInfoCache.get(userId)
    if (res) {
      return res
    }

    const user = await knex('users')
      .where({ platform: 'webchat', userId })
      .then()
      .get(0)

    res = {
      full_name: user && `${user.first_name} ${user.last_name}`,
      avatar_url: (user && user.picture_url) || null
    }

    userInfoCache.set(userId, res)

    return res
  }

  const bumpLastHeardOn = memoize(conversationId =>
    throttle(
      () =>
        knex('web_conversations')
          .where('id', conversationId)
          .update({ last_heard_on: h.date.now() })
          .then(),
      50
    )
  )

  async function appendUserMessage(userId, conversationId, { type, text, raw, data }) {
    userId = sanitizeUserId(userId)

    await checkConversation(conversationId, userId)

    const message = {
      id: uuid.v4(),
      conversationId,
      userId,
      ...(await getUserInfo(userId)),
      message_type: type,
      message_text: text,
      message_raw: h.json.set(raw),
      message_data: h.json.set(data),
      sent_on: h.date.now()
    }

    const shouldUpdateLastHeard = userInitiatedMessageTypes.includes(type.toLowerCase())

    // PERF: message insertion is a serious bottlenecks
    // consider implementing in-memory batching queue
    // similar to logs

    return Promise.join(
      knex('web_messages')
        .insert(message)
        .then(),

      shouldUpdateLastHeard && bumpLastHeardOn(conversationId)(),

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
      message_raw: h.json.set(raw),
      message_data: h.json.set(data),
      sent_on: h.date.now()
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

  const createConversation = (userId, { originatesFromUserMessage } = {}) => {
    userId = sanitizeUserId(userId)

    const uid = Math.random()
      .toString()
      .substr(2, 6)
    const title = `Conversation ${uid}`

    return h.insertAndRetrieve('web_conversations', {
      userId,
      created_on: h.date.now(),
      last_heard_on: originatesFromUserMessage ? h.date.now() : null,
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

  async function getOrCreateRecentConversation(userId, { ignoreLifetimeExpiry, originatesFromUserMessage } = {}) {
    userId = sanitizeUserId(userId)

    const recentCondition =
      !ignoreLifetimeExpiry &&
      helpers(knex).date.isAfter('last_heard_on', moment().subtract(RECENT_CONVERSATION_LIFETIME, 'ms'))

    const conversation = await knex('web_conversations')
      .select('id', 'last_heard_on')
      .whereNotNull('last_heard_on')
      .andWhere({ userId })
      .andWhere(recentCondition || {})
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

    return createConversation(userId, { originatesFromUserMessage })
  }

  async function listConversations(userId) {
    userId = sanitizeUserId(userId)

    const conversations = await knex('web_conversations')
      .select('id')
      .where({ userId })
      .orderBy('last_heard_on', 'desc')
      .limit(RECENT_CONVERSATIONS_LIMIT)
      .then()

    const conversationIds = conversations.map(c => c.id)

    let lastMessages

    if (h.isLite()) {
      const lastMessagesDate = knex('web_messages')
        .whereIn('conversationId', conversationIds)
        .groupBy('conversationId')
        .select(knex.raw('max(sent_on) as date'))

      lastMessages = knex
        .from('web_messages')
        .select('*')
        .whereIn('sent_on', lastMessagesDate)
    } else {
      lastMessages = knex
        .from('web_messages')
        .distinct(knex.raw('ON ("conversationId") *'))
        .orderBy('conversationId')
        .orderBy('sent_on', 'desc')
    }

    // TODO: before this code was changed the join here
    // used to be a bottleneck
    // if true could be fixed by collecting all conv data in the first query
    // see https://github.com/botpress/botpress/commit/16b075b1b40807833a85ef241c0110e3bc1529e5#diff-68e20bc9f0dcb53c1e8aeb45b6ec9ab8
    // The idea is:
    // - in the first query collect all convo data once
    // - select the needed messages without JOIN
    // - manually extend messages with their convo data matched by convo ID
    return knex
      .from(function() {
        this.from('web_conversations')
          .where({ userId })
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
        knex.raw('wm.full_name as message_author'),
        knex.raw('wm.avatar_url as message_author_avatar'),
        knex.raw('wm.sent_on as message_sent_on')
      )
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

    messages.forEach(m => {
      Object.assign(m, {
        message_raw: h.json.get(m.message_raw),
        message_data: h.json.get(m.message_data)
      })
    })

    return Object.assign({}, conversation, {
      messages: orderBy(messages, ['sent_on'], ['asc'])
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
    getOrCreateRecentConversation,
    isLite
  }
}

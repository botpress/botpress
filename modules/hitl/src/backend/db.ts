import Bluebird from 'bluebird'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { SDK } from '.'
import { HitlSession, HitlSessionOverview, Message, SessionIdentity } from './typings'

// trims SQL queries from objects
const toPlainObject = object =>
  _.mapValues(object, v => {
    return v && v.sql ? v.sql : v
  })

export const TABLE_NAME_SESSIONS = 'hitl_sessions'
export const TABLE_NAME_MESSAGES = 'hitl_messages'

export default class HitlDb {
  knex: any

  constructor(private bp: SDK) {
    this.knex = bp.database
  }

  initialize() {
    if (!this.knex) {
      throw new Error('you must initialize the database before')
    }

    return this.knex
      .createTableIfNotExists(TABLE_NAME_SESSIONS, function(table) {
        table.increments('id').primary()
        table.string('botId').notNullable()
        table.string('channel')
        table.string('userId')
        table.string('full_name')
        table.string('user_image_url')
        table.timestamp('last_event_on')
        table.timestamp('last_heard_on')
        table.boolean('paused')
        table.string('paused_trigger')
        table.string('thread_id')
      })
      .then(() => {
        return this.knex.createTableIfNotExists(TABLE_NAME_MESSAGES, function(table) {
          table.increments('id').primary()
          table
            .integer('session_id')
            .references(`${TABLE_NAME_SESSIONS}.id`)
            .onDelete('CASCADE')
          table.string('type')
          table.string('source')
          table.string('text', 640)
          table.jsonb('raw_message')
          table.enu('direction', ['in', 'out'])
          table.timestamp('ts')
        })
      })
      .then(() =>
        this.knex(TABLE_NAME_MESSAGES)
          .columnInfo('text')
          .then(info => {
            if (info.maxLength === null || this.knex.isLite) {
              return
            }

            return this.knex.schema.alterTable(TABLE_NAME_MESSAGES, table => {
              table.text('text', 'longtext').alter()
            })
          })
      )
  }

  createUserSession = async (event: sdk.IO.Event) => {
    let profileUrl = undefined
    let displayName = `# ${Math.random()
      .toString()
      .substr(2)}`

    const user: sdk.User = (await this.bp.users.getOrCreateUser(event.channel, event.target, event.botId)).result

    if (user && user.attributes) {
      const { first_name, last_name, full_name, profile_pic, picture_url } = user.attributes

      profileUrl = profile_pic || picture_url
      displayName = full_name || (first_name && last_name && `${first_name} ${last_name}`) || displayName
    }

    const session = {
      botId: event.botId,
      channel: event.channel,
      userId: event.target,
      thread_id: event.threadId,
      user_image_url: profileUrl,
      last_event_on: this.knex.date.now(),
      last_heard_on: this.knex.date.now(),
      paused: 0,
      full_name: displayName,
      paused_trigger: undefined
    }

    const dbSession = await this.knex.insertAndRetrieve(TABLE_NAME_SESSIONS, session, '*')

    return { is_new_session: true, ...dbSession }
  }

  async getOrCreateUserSession(event: sdk.IO.Event) {
    if (!event.target) {
      return undefined
    }

    const where = { botId: event.botId, channel: event.channel, userId: event.target }
    if (event.threadId) {
      where['thread_id'] = event.threadId
    }

    return this.knex(TABLE_NAME_SESSIONS)
      .where(where)
      .select('*')
      .limit(1)
      .then(users => {
        if (!users || users.length === 0) {
          return this.createUserSession(event)
        } else {
          return users[0]
        }
      })
  }

  async getSessionById(sessionId: string): Promise<HitlSession | undefined> {
    return this.knex(TABLE_NAME_SESSIONS)
      .where({ id: sessionId })
      .select('*')
      .get(0)
      .then(
        res =>
          res && {
            id: res.id,
            botId: res.botId,
            channel: res.channel,
            userId: res.userId,
            threadId: res.thread_id,
            fullName: res.full_name,
            profileUrl: res.user_image_url,
            lastEventOn: res.last_event_on,
            lastHeardOn: res.last_heard_on,
            isPaused: res.paused,
            pausedBy: res.paused_trigger
          }
      )
  }

  buildUpdate = direction => {
    const now = this.knex.date.now()
    return direction === 'in'
      ? { last_event_on: now }
      : {
          last_event_on: now,
          last_heard_on: now
        }
  }

  async appendMessageToSession(event: sdk.IO.Event, sessionId: string, direction: string) {
    const payload = event.payload || {}
    const text = event.preview || payload.text || (payload.wrapped && payload.wrapped.text)

    let source = 'user'
    if (direction === 'out') {
      source = event.payload.agent ? 'agent' : 'bot'
    }

    const message = {
      session_id: sessionId,
      type: event.type,
      raw_message: event.payload,
      text,
      source,
      direction,
      ts: new Date()
    }

    return Bluebird.join(
      this.knex(TABLE_NAME_MESSAGES).insert({
        ...message,
        raw_message: this.knex.json.set(message.raw_message || {}),
        ts: this.knex.date.now()
      }),
      this.knex(TABLE_NAME_SESSIONS)
        .where({ id: sessionId })
        .update(this.buildUpdate(direction)),
      () => toPlainObject(message)
    )
  }

  async setSessionPauseState(isPaused: boolean, session: SessionIdentity, trigger: string): Promise<number> {
    const { botId, channel, userId, sessionId, threadId } = session

    if (sessionId) {
      return this.knex(TABLE_NAME_SESSIONS)
        .where({ id: sessionId })
        .update({ paused: isPaused ? 1 : 0, paused_trigger: trigger })
        .then(() => parseInt(sessionId))
    } else {
      const where = { botId, channel, userId }
      if (threadId) {
        where['thread_id'] = threadId
      }
      return this.knex(TABLE_NAME_SESSIONS)
        .where(where)
        .update({ paused: isPaused ? 1 : 0, paused_trigger: trigger })
        .then(() => {
          return this.knex(TABLE_NAME_SESSIONS)
            .where(where)
            .select('id')
        })
        .then(sessions => parseInt(sessions[0].id))
    }
  }

  async isSessionPaused(session: SessionIdentity): Promise<boolean> {
    const { botId, channel, userId, sessionId, threadId } = session

    const toBool = s => this.knex.bool.parse(s)
    return this.knex(TABLE_NAME_SESSIONS)
      .where(sessionId ? { id: sessionId } : { botId, channel, userId, threadId })
      .select('paused')
      .then()
      .get(0)
      .then(s => s && toBool(s.paused))
  }

  async getAllSessions(
    onlyPaused: boolean,
    botId: string,
    sessionIds?: string[]
  ): Promise<{ total: number; sessions: HitlSessionOverview[] }> {
    const knex2 = this.knex

    let query = this.knex
      .select('*')
      .from(function() {
        this.select([knex2.raw('max(id) as mId'), 'session_id', knex2.raw('count(*) as count')])
          .from(TABLE_NAME_MESSAGES)
          .groupBy('session_id')
          .as('q1')
      })
      .join(TABLE_NAME_MESSAGES, this.knex.raw('q1.mId'), `${TABLE_NAME_MESSAGES}.id`)
      .join(TABLE_NAME_SESSIONS, this.knex.raw('q1.session_id'), `${TABLE_NAME_SESSIONS}.id`)
      .join('srv_channel_users', this.knex.raw('srv_channel_users.user_id'), `${TABLE_NAME_SESSIONS}.userId`)
      .where({ botId })

    if (onlyPaused) {
      query = query.whereRaw(`${TABLE_NAME_SESSIONS}.paused = ${this.knex.bool.true()}`)
    }

    if (sessionIds) {
      query = query.whereIn(`${TABLE_NAME_SESSIONS}.id`, sessionIds)
    }

    return query
      .orderBy(`${TABLE_NAME_SESSIONS}.last_event_on`, 'desc')
      .limit(100)
      .then(results =>
        results.map(res => ({
          id: res.session_id,
          botId: res.botId,
          channel: res.channel,
          threadId: res.thread_id,
          lastEventOn: res.last_event_on,
          lastHeardOn: res.last_heard_on,
          isPaused: res.paused,
          pausedBy: res.paused_trigger,
          lastMessage: {
            id: res.mId,
            type: res.type,
            source: res.source,
            text: res.text,
            raw_message: res.raw_message,
            direction: res.direction,
            ts: res.ts
          },
          user: {
            id: res.userId,
            fullName: res.full_name,
            avatarUrl: res.user_image_url,
            attributes: this.knex.json.get(res.attributes)
          }
        }))
      )
  }

  async getSessionMessages(sessionId: string): Promise<Message[]> {
    return this.knex
      .orderBy('ts', 'asc')
      .select('*')
      .from(function() {
        this.from(TABLE_NAME_MESSAGES)
          .where({ session_id: sessionId })
          .orderBy('ts', 'desc')
          .limit(100)
          .select('*')
          .as('q1')
      })
      .then(messages =>
        messages.map(msg => ({
          ...msg,
          raw_message: this.knex.json.get(msg.raw_message)
        }))
      )
  }

  async searchSessions(searchTerm: string): Promise<string[]> {
    const query = this.knex(TABLE_NAME_SESSIONS)
      .join('srv_channel_users', this.knex.raw('srv_channel_users.user_id'), `${TABLE_NAME_SESSIONS}.userId`)
      .where('full_name', 'like', `%${searchTerm}%`)
      .orWhere('srv_channel_users.user_id', 'like', `%${searchTerm}%`)

    if (this.knex.isLite) {
      query.orWhere('attr_fullName', 'like', `%${searchTerm}%`)
      query.select(
        this.knex.raw(
          `${TABLE_NAME_SESSIONS}.id, json_extract(srv_channel_users.attributes, '$.full_name') as attr_fullName`
        )
      )
    } else {
      query.orWhereRaw(`srv_channel_users.attributes ->>'full_name' like '%${searchTerm}%'`)
      query.select(this.knex.raw(`${TABLE_NAME_SESSIONS}.id`))
    }

    return query
      .orderBy('last_heard_on')
      .limit(100)
      .then(results => results.map(r => r.id))
  }
}

import Bluebird from 'bluebird'
import _ from 'lodash'
import * as sdk from 'botpress/sdk'

import { SDK } from '.'

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
      .createTableIfNotExists('hitl_sessions', function(table) {
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
      })
      .then(() => {
        return this.knex.createTableIfNotExists('hitl_messages', function(table) {
          table.increments('id').primary()
          table
            .integer('session_id')
            .references('hitl_sessions.id')
            .onDelete('CASCADE')
          table.string('type')
          table.string('text', 640)
          table.jsonb('raw_message')
          table.enu('direction', ['in', 'out'])
          table.timestamp('ts')
        })
      })
      .then(() =>
        this.knex('hitl_messages')
          .columnInfo('text')
          .then(info => {
            if (info.maxLength === null || this.knex.isLite) {
              return
            }

            return this.knex.schema.alterTable('hitl_messages', table => {
              table.text('text', 'longtext').alter()
            })
          })
      )
  }

  createUserSession = async (event: sdk.IO.IncomingEvent) => {
    let profileUrl = undefined
    let full_name =
      '#' +
      Math.random()
        .toString()
        .substr(2)

    const user: sdk.User = (await this.bp.users.getOrCreateUser(event.channel, event.target)).result

    if (user && user.attributes && user.attributes.first_name && user.attributes.last_name) {
      profileUrl = user.attributes.profile_pic || user.attributes.picture_url
      full_name = user.attributes.first_name + ' ' + user.attributes.last_name
    }

    const session = {
      botId: event.botId,
      channel: event.channel,
      userId: event.target,
      user_image_url: profileUrl,
      last_event_on: this.knex.date.now(),
      last_heard_on: this.knex.date.now(),
      paused: 0,
      full_name: full_name,
      paused_trigger: undefined
    }

    const dbSession = await this.knex.insertAndRetrieve('hitl_sessions', session, '*')

    return { is_new_session: true, ...dbSession }
  }

  async getOrCreateUserSession(event) {
    if (!event.target) {
      return undefined
    }

    return this.knex('hitl_sessions')
      .where({ botId: event.botId, channel: event.channel, userId: event.target })
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

  getSessionById(sessionId) {
    return this.knex('hitl_sessions')
      .where({ id: sessionId })
      .select('*')
      .limit(1)
      .then(users => {
        if (!users || users.length === 0) {
          return undefined
        } else {
          return users[0]
        }
      })
  }

  toPlainObject(object) {
    // trims SQL queries from objects
    return _.mapValues(object, v => {
      return v && v.sql ? v.sql : v
    })
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

  appendMessageToSession(event, sessionId, direction) {
    const message = {
      session_id: sessionId,
      type: event.type,
      text: event.payload.text,
      raw_message: event.payload,
      direction: direction,
      ts: this.knex.date.now()
    }

    return Bluebird.join(
      this.knex('hitl_messages').insert(message),
      this.knex('hitl_sessions')
        .where({ id: sessionId })
        .update(this.buildUpdate(direction)),
      () => this.toPlainObject(message)
    )
  }

  setSessionPaused(paused, session, trigger) {
    const { botId = undefined, channel = undefined, userId = undefined, sessionId = undefined } = session

    if (sessionId) {
      return this.knex('hitl_sessions')
        .where({ id: sessionId })
        .update({ paused: paused ? 1 : 0, paused_trigger: trigger })
        .then(() => parseInt(sessionId))
    } else {
      return this.knex('hitl_sessions')
        .where({ botId, channel, userId })
        .update({ paused: paused ? 1 : 0, paused_trigger: trigger })
        .then(() => {
          return this.knex('hitl_sessions')
            .where({ botId, channel, userId })
            .select('id')
        })
        .then(sessions => parseInt(sessions[0].id))
    }
  }

  isSessionPaused(session) {
    const { botId = undefined, channel = undefined, userId = undefined, sessionId = undefined } = session
    const toBool = s => this.knex.bool.parse(s)

    if (sessionId) {
      return this.knex('hitl_sessions')
        .where({ id: sessionId })
        .select('paused')
        .then()
        .get(0)
        .then(s => s && toBool(s.paused))
    } else {
      return this.knex('hitl_sessions')
        .where({ botId, channel, userId })
        .select('paused')
        .then()
        .get(0)
        .then(s => s && toBool(s.paused))
    }
  }

  getAllSessions(onlyPaused, botId) {
    let condition = ''
    const knex2 = this.knex
    if (onlyPaused === true) {
      condition = 'hitl_sessions.paused = ' + this.knex.bool.true()
    }

    return this.knex
      .select('*')
      .from(function() {
        this.select([knex2.raw('max(id) as mId'), 'session_id', knex2.raw('count(*) as count')])
          .from('hitl_messages')
          .groupBy('session_id')
          .as('q1')
      })
      .join('hitl_messages', this.knex.raw('q1.mId'), 'hitl_messages.id')
      .join('hitl_sessions', this.knex.raw('q1.session_id'), 'hitl_sessions.id')
      .whereRaw(condition)
      .where({ botId })
      .orderBy('hitl_sessions.last_event_on', 'desc')
      .limit(100)
      .then(results => ({
        total: 0,
        sessions: results
      }))
  }

  getSessionData(sessionId) {
    return this.knex('hitl_sessions')
      .where({ session_id: sessionId })
      .join('hitl_messages', 'hitl_messages.session_id', 'hitl_sessions.id')
      .orderBy('hitl_messages.id', 'desc')
      .limit(100)
      .select('*')
      .then(messages => _.orderBy(messages, ['id'], ['asc']))
  }
}

import _ from 'lodash'
import moment from 'moment'

import { SDK } from '.'

function padDigits(number, digits) {
  return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number
}

export default class BroadcastDb {
  knex: any

  constructor(private bp: SDK) {
    this.knex = bp.database
  }

  initialize() {
    if (!this.knex) {
      throw new Error('you must initialize the database before')
    }

    return this.knex
      .createTableIfNotExists('broadcast_schedules', function(table) {
        table.increments('id').primary()
        table.string('botId')
        table.string('date_time')
        table.timestamp('ts')
        table.string('text')
        table.string('type')
        table.boolean('outboxed')
        table.boolean('errored')
        table.integer('total_count')
        table.integer('sent_count')
        table.timestamp('created_on')
        table.string('filters')
      })
      .then(() => {
        return this.knex.createTableIfNotExists('broadcast_outbox', function(table) {
          table
            .integer('scheduleId')
            .references('broadcast_schedules.id')
            .onDelete('CASCADE')
          table.string('userId').references('srv_channel_users.user_id')
          table.primary(['scheduleId', 'userId'])
          table.string('botId')
          table.timestamp('ts')
        })
      })
  }

  addSchedule({ botId, date, time, timezone, content, type, filters }) {
    const dateTime = date + ' ' + time
    let ts = undefined

    if (timezone) {
      ts = moment(new Date(dateTime + ' ' + timezone)).toDate()
    }

    const row = {
      botId,
      date_time: dateTime,
      ts: ts ? this.knex.date.format(ts) : undefined,
      text: content,
      type: type,
      outboxed: false,
      errored: false,
      total_count: 0,
      sent_count: 0,
      created_on: this.knex.date.now(),
      filters: JSON.stringify(filters)
    }

    return this.knex('broadcast_schedules')
      .insert(row, 'id')
      .then()
      .get(0)
  }

  updateSchedule({ id, date, time, timezone, content, type, filters }) {
    const dateTime = date + ' ' + time
    let ts = undefined
    if (timezone) {
      ts = moment(new Date(dateTime + ' ' + timezone)).toDate()
    }

    const row = {
      date_time: dateTime,
      ts: ts ? this.knex.date.format(ts) : undefined,
      text: content,
      type: type,
      filters: JSON.stringify(filters)
    }

    return this.knex('broadcast_schedules')
      .where({
        id,
        outboxed: this.knex.bool.false()
      })
      .update(row)
      .then()
  }

  deleteSchedule(id) {
    return this.knex('broadcast_schedules')
      .where({ id })
      .delete()
      .then(() => {
        return this.knex('broadcast_outbox')
          .where({ scheduleId: id })
          .del()
          .then(() => true)
      })
  }

  listSchedules(botId) {
    return this.knex('broadcast_schedules')
      .where({ botId })
      .then()
  }

  getBroadcastSchedulesByTime(botId, upcomingFixedTime, upcomingVariableTime) {
    return this.knex('broadcast_schedules')
      .where({
        botId,
        outboxed: this.knex.bool.false()
      })
      .andWhere(function() {
        this.where(function() {
          this.whereNotNull('ts').andWhere(upcomingFixedTime)
        }).orWhere(function() {
          this.whereNull('ts').andWhere(upcomingVariableTime)
        })
      })
  }

  async getUsersTimezone() {
    const attrs = await this.knex('srv_channel_users').select('attributes')
    const timezones = attrs.map(({ attributes: { timezone } }) => timezone)

    return [...new Set(timezones)]
  }

  setBroadcastOutbox(botId, schedule, tz) {
    const initialTz = tz
    const sign = Number(tz) >= 0 ? '+' : '-'
    tz = padDigits(Math.abs(Number(tz)), 2)
    const relTime = moment(`${schedule['date_time']}${sign}${tz}`, 'YYYY-MM-DD HH:mmZ').toDate()
    const adjustedTime = this.knex.date.format(schedule['ts'] ? schedule['ts'] : relTime)
    const whereClause = _.isNil(initialTz)
      ? "where attributes -> 'timezone' IS NULL"
      : "where attributes ->> 'timezone' = :initialTz"

    const sql = `insert into broadcast_outbox ("userId", "scheduleId", "botId", "ts")
      select userId, :scheduleId, :botId, :adjustedTime
      from (
        select user_id as userId
        from srv_channel_users
        ${whereClause}
      ) as q1`

    return this.knex
      .raw(sql, {
        scheduleId: schedule['id'],
        adjustedTime,
        initialTz,
        botId
      })
      .then()
  }

  // TODO: check naming
  getOutboxCount(botId, schedule) {
    return this.knex('broadcast_outbox')
      .where({ botId, scheduleId: schedule['id'] })
      .select(this.knex.raw('count(*) as count'))
      .then()
      .get(0)
  }

  updateTotalCount(schedule, count) {
    return this.knex('broadcast_schedules')
      .where({ id: schedule['id'] })
      .update({
        outboxed: this.knex.bool.true(),
        total_count: count
      })
  }

  getBroadcastOutbox(botId, isPast) {
    return this.knex('broadcast_outbox')
      .where(function() {
        this.where(isPast).andWhere('broadcast_outbox.botId', botId)
      })
      .join('srv_channel_users', 'srv_channel_users.user_id', 'broadcast_outbox.userId')
      .join('broadcast_schedules', 'scheduleId', 'broadcast_schedules.id')
      .limit(1000)
      .select([
        'srv_channel_users.user_id as userId',
        'srv_channel_users.channel as platform',
        'broadcast_schedules.text as text',
        'broadcast_schedules.type as type',
        'broadcast_schedules.id as scheduleId',
        'broadcast_schedules.filters as filters',
        'broadcast_outbox.ts as sendTime',
        'broadcast_outbox.userId as scheduleUser'
      ])
  }

  deleteBroadcastOutbox(userId, scheduleId) {
    return this.knex('broadcast_outbox')
      .where({ userId, scheduleId })
      .delete()
  }

  deleteBroadcastOutboxById(scheduleId) {
    return this.knex('broadcast_outbox')
      .where({ scheduleId })
      .delete()
  }

  increaseBroadcastSentCount(id) {
    return this.knex('broadcast_schedules')
      .where({ id })
      .update({ sent_count: this.knex.raw('sent_count + 1') })
  }

  updateErrorField(scheduleId) {
    return this.knex('broadcast_schedules')
      .where({ id: scheduleId })
      .update({
        errored: this.knex.bool.true()
      })
  }
}

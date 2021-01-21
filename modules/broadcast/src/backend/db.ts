import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import moment from 'moment'

import { Broadcast, Schedule, ScheduleRow } from './typings'

function padDigits(number, digits) {
  return Array(Math.max(digits - String(number).length + 1, 0)).join('0') + number
}

export default class BroadcastDb {
  knex: sdk.KnexExtended

  constructor(bp: typeof sdk) {
    this.knex = bp.database
  }

  initialize() {
    return this.knex
      .createTableIfNotExists('broadcast_schedules', table => {
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
        return this.knex.createTableIfNotExists('broadcast_outbox', table => {
          table
            .integer('scheduleId')
            .references('broadcast_schedules.id')
            .onDelete('CASCADE')
          table
            .integer('userId')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable('srv_channel_users')
          table.primary(['scheduleId', 'userId'])
          table.string('botId')
          table.timestamp('ts')
        })
      })
  }

  async addSchedule({ botId, date, time, timezone, content, type, filters }: Schedule): Promise<ScheduleRow> {
    const dateTime = `${date} ${time}`
    let ts = undefined

    if (timezone) {
      ts = moment(new Date(`${dateTime} ${timezone}`)).toDate()
    }

    const row: ScheduleRow = {
      botId,
      date_time: dateTime,
      ts: ts ? this.knex.date.format(ts) : undefined,
      text: content,
      type,
      outboxed: false,
      errored: false,
      total_count: 0,
      sent_count: 0,
      created_on: this.knex.date.now(),
      filters: JSON.stringify(filters)
    }

    return this.knex('broadcast_schedules').insert(row)
  }

  async updateSchedule({ id, botId, date, time, timezone, content, type, filters }: Schedule): Promise<void> {
    const dateTime = `${date} ${time}`
    let ts = undefined
    if (timezone) {
      ts = moment(new Date(`${dateTime} ${timezone}`)).toDate()
    }

    const row: Partial<ScheduleRow> = {
      date_time: dateTime,
      ts: ts ? this.knex.date.format(ts) : undefined,
      text: content,
      type,
      filters: JSON.stringify(filters)
    }

    await this.knex('broadcast_schedules')
      .where({ id, botId, outboxed: this.knex.bool.false() })
      .update(row)
  }

  async deleteSchedule(id: number): Promise<void> {
    await this.knex('broadcast_schedules')
      .where({ id })
      .delete()

    await this.knex('broadcast_outbox')
      .where({ scheduleId: id })
      .delete()
  }

  async listSchedules(botId: string): Promise<ScheduleRow[]> {
    return this.knex('broadcast_schedules').where({ botId })
  }

  async getBroadcastSchedulesByTime(botId: string, upcomingFixedTime, upcomingVariableTime): Promise<Schedule[]> {
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

  async getUsersTimezone(): Promise<number[]> {
    const attrs = await this.knex('srv_channel_users').select('attributes')
    const timezones = attrs.map(({ attributes }) => attributes && this.knex.json.get(attributes).timezone)

    return [...new Set(timezones)]
  }

  async setBroadcastOutbox(botId: string, schedule: Schedule, tz: number): Promise<any> {
    const initialTz = tz
    const sign = Number(tz) >= 0 ? '+' : '-'
    const paddedTz = padDigits(Math.abs(Number(tz)), 2)
    const relTime = moment(`${schedule['date_time']}${sign}${paddedTz}`, 'YYYY-MM-DD HH:mmZ').toDate()
    const adjustedTime = this.knex.date.format(schedule['ts'] ? schedule['ts'] : relTime)
    const whereClause = this.knex.isLite
      ? _.isNil(initialTz)
        ? "where json_extract(attributes, '$.timezone') IS NULL"
        : "where json_extract(attributes, '$.timezone') = :initialTz"
      : _.isNil(initialTz)
      ? "where attributes-> 'timezone' IS NULL"
      : "where cast (attributes->> 'timezone' as integer) = :initialTz"

    const sql = `insert into broadcast_outbox ("userId", "scheduleId", "botId", "ts")
      select userId, :scheduleId, :botId, :adjustedTime
      from (
        select id as userId
        from srv_channel_users as scu
        inner join bot_chat_users as bcu on bcu."userId" = scu.user_id
        ${whereClause}
        and bcu."botId" = :botId
      ) as q1`

    return this.knex.raw(sql, {
      scheduleId: schedule['id'],
      adjustedTime,
      initialTz,
      botId
    })
  }

  async getOutboxCount(botId: string, schedule: Schedule): Promise<number> {
    const result = await this.knex('broadcast_outbox')
      .where({ botId, scheduleId: schedule.id })
      .count<Record<string, number>>('* as qty')
      .first()
      .then(result => result!.qty)

    return typeof result === 'number' ? result : parseInt(result)
  }

  updateTotalCount(schedule: Schedule, count: number) {
    return this.knex('broadcast_schedules')
      .where({ id: schedule.id })
      .update({ outboxed: this.knex.bool.true(), total_count: count })
  }

  async getBroadcastOutbox(botId: string): Promise<Broadcast[]> {
    return this.knex('broadcast_outbox')
      .whereRaw('broadcast_outbox.ts < ?', [this.knex.date.now()])
      .andWhere('broadcast_outbox.botId', botId)
      .join('srv_channel_users', 'srv_channel_users.id', 'broadcast_outbox.userId')
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

  async deleteBroadcastOutbox(userId: string, scheduleId: number): Promise<void> {
    return this.knex('broadcast_outbox')
      .where({ userId, scheduleId })
      .delete()
  }

  async deleteBroadcastOutboxById(scheduleId: number): Promise<void> {
    return this.knex('broadcast_outbox')
      .where({ scheduleId })
      .delete()
  }

  async increaseBroadcastSentCount(id: number): Promise<void> {
    return this.knex('broadcast_schedules')
      .where({ id })
      .update({ sent_count: this.knex.raw('sent_count + 1') })
  }

  async updateErrorField(scheduleId: number): Promise<void> {
    return this.knex('broadcast_schedules')
      .where({ id: scheduleId })
      .update({ errored: this.knex.bool.true() })
  }
}

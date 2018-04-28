import { DatabaseHelpers as helpers } from 'botpress'

import moment from 'moment'
import Promise from 'bluebird'
import retry from 'bluebird-retry'
import _ from 'lodash'

import DB from './db'

let knex = null
let bp = null

let schedulingLock = false
let sendingLock = false

const INTERVAL_BASE = 10 * 1000
const SCHEDULE_TO_OUTBOX_INTERVAL = INTERVAL_BASE * 1
const SEND_BROADCAST_INTERVAL = INTERVAL_BASE * 1

const emitChanged = _.throttle(() => {
  bp && bp.events.emit('broadcast.changed')
}, 1000)

function padDigits(number, digits) {
  return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number
}

function scheduleToOutbox() {
  if (!knex || schedulingLock) {
    return
  }

  const inFiveMinutes = moment()
    .add(5, 'minutes')
    .toDate()
  const endOfDay = moment(inFiveMinutes)
    .add(14, 'hours')
    .toDate()

  const upcomingFixedTime = helpers(knex).date.isAfter(inFiveMinutes, 'ts')
  const upcomingVariableTime = helpers(knex).date.isAfter(endOfDay, 'date_time')

  schedulingLock = true

  return knex('broadcast_schedules')
    .where({
      outboxed: helpers(knex).bool.false()
    })
    .andWhere(function() {
      this.where(function() {
        this.whereNotNull('ts').andWhere(upcomingFixedTime)
      }).orWhere(function() {
        this.whereNull('ts').andWhere(upcomingVariableTime)
      })
    })
    .then(schedules => {
      return Promise.map(schedules, schedule => {
        return knex('users')
          .distinct('timezone')
          .select()
          .then(timezones => {
            return Promise.mapSeries(timezones, ({ timezone: tz }) => {
              const initialTz = tz
              const sign = Number(tz) >= 0 ? '+' : '-'
              tz = padDigits(Math.abs(Number(tz)), 2)
              const relTime = moment(`${schedule.date_time}${sign}${tz}`, 'YYYY-MM-DD HH:mmZ').toDate()
              const adjustedTime = helpers(knex).date.format(schedule.ts ? schedule.ts : relTime)

              const whereClause = _.isNil(initialTz) ? 'where timezone IS NULL' : 'where timezone = :initialTz'

              const sql = `insert into broadcast_outbox ("userId", "scheduleId", "ts")
            select userId, :scheduleId, :adjustedTime
            from (
              select id as userId
              from users
              ${whereClause}
            ) as q1`

              return knex
                .raw(sql, {
                  scheduleId: schedule.id,
                  adjustedTime,
                  initialTz
                })
                .then()
            })
          })
          .then(() => {
            return knex('broadcast_outbox')
              .where({ scheduleId: schedule.id })
              .select(knex.raw('count(*) as count'))
              .then()
              .get(0)
              .then(({ count }) => {
                return knex('broadcast_schedules')
                  .where({ id: schedule.id })
                  .update({
                    outboxed: helpers(knex).bool.true(),
                    total_count: count
                  })
                  .then(() => {
                    bp.logger.info('[broadcast] Scheduled broadcast #' + schedule.id, '. [' + count + ' messages]')

                    if (schedule.filters && JSON.parse(schedule.filters).length > 0) {
                      bp.logger.info(
                        '[broadcast] Filters found on broadcast #' + schedule.id,
                        '. Filters are applied at sending time.'
                      )
                    }

                    emitChanged()
                  })
              })
          })
      })
    })
    .finally(() => {
      schedulingLock = false
    })
}

const _sendBroadcast = Promise.method(row => {
  let dropPromise = Promise.resolve(false)

  if (row.filters) {
    dropPromise = Promise.mapSeries(JSON.parse(row.filters), filter => {
      let fnBody = filter.trim()
      if (!/^return /i.test(fnBody)) {
        fnBody = 'return ' + fnBody
      }

      const fn = new Function('bp', 'userId', 'platform', fnBody)
      return Promise.method(fn)(bp, row.userId, row.platform)
    }).then(values => {
      return _.some(values, v => {
        if (v !== true && v !== false) {
          bp.logger.warn('[broadcast] Filter returned something other ' + 'than a boolean (or a Promise of a boolean)')
        }

        return typeof v !== 'undefined' && v !== null && v !== true
      })
    })
  }

  return dropPromise.then(drop => {
    if (drop) {
      bp.logger.debug('[broadcast] Drop sending #' + row.scheduleId + ' to user: ' + row.userId + '. Reason = Filters')
      return
    }
    return bp.renderers.sendToUser(row.userId, '#!' + row.text)
  })
})

function sendBroadcasts() {
  if (!knex || sendingLock) {
    return
  }

  sendingLock = true

  const isPast = helpers(knex).date.isBefore(knex.raw('"broadcast_outbox"."ts"'), helpers(knex).date.now())

  knex('broadcast_outbox')
    .where(isPast)
    .join('users', 'users.id', 'broadcast_outbox.userId')
    .join('broadcast_schedules', 'scheduleId', 'broadcast_schedules.id')
    .limit(1000)
    .select([
      'users.userId as userId',
      'users.platform as platform',
      'broadcast_schedules.text as text',
      'broadcast_schedules.type as type',
      'broadcast_schedules.id as scheduleId',
      'broadcast_schedules.filters as filters',
      'broadcast_outbox.ts as sendTime',
      'broadcast_outbox.userId as scheduleUser'
    ])
    .then(rows => {
      let abort = false
      return Promise.mapSeries(rows, row => {
        if (abort) {
          return
        }
        return retry(() => _sendBroadcast(row), {
          max_tries: 3,
          interval: 1000,
          backoff: 3
        })
          .then(() => {
            return knex('broadcast_outbox')
              .where({ userId: row.scheduleUser, scheduleId: row.scheduleId })
              .delete()
              .then(() => {
                return knex('broadcast_schedules')
                  .where({ id: row.scheduleId })
                  .update({ sent_count: knex.raw('sent_count + 1') })
                  .then(() => emitChanged())
              })
          })
          .catch(err => {
            abort = true

            bp.logger.error(
              '[broadcast] Broadcast #' + row.scheduleId + ' failed. Broadcast aborted. Reason: ' + err.message
            )

            bp.notifications.send({
              level: 'error',
              message: 'Broadcast #' + row.scheduleId + ' failed.' + ' Please check logs for the reason why.',
              url: '/logs'
            })

            return knex('broadcast_schedules')
              .where({ id: row.scheduleId })
              .update({
                errored: helpers(knex).bool.true()
              })
              .then(() => {
                return knex('broadcast_outbox')
                  .where({ scheduleId: row.scheduleId })
                  .delete()
                  .then(() => emitChanged())
              })
          })
      })
    })
    .finally(() => {
      sendingLock = false
    })
}

module.exports = botpress => {
  bp = botpress

  bp.db.get().then(k => {
    const { initialize } = DB(k)
    knex = k
    initialize()
  })

  setInterval(scheduleToOutbox, SCHEDULE_TO_OUTBOX_INTERVAL)
  setInterval(sendBroadcasts, SEND_BROADCAST_INTERVAL)
}

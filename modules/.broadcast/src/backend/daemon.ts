import Promise from 'bluebird'
import retry from 'bluebird-retry'
import _ from 'lodash'
import moment from 'moment'

import { SDK } from '.'
import Database from './db'

let knex = undefined
let bp = undefined

let schedulingLock = false
let sendingLock = false

const INTERVAL_BASE = 10 * 1000
const SCHEDULE_TO_OUTBOX_INTERVAL = INTERVAL_BASE * 1
const SEND_BROADCAST_INTERVAL = INTERVAL_BASE * 1

const emitChanged = _.throttle(() => {
  bp && bp.events.emit('broadcast.changed')
}, 1000)

function initialize(_bp: SDK, _db: Database) {
  bp = _bp
  knex = _db.knex
}

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

  const upcomingFixedTime = knex.date.isAfter(inFiveMinutes, 'ts')
  const upcomingVariableTime = knex.date.isAfter(endOfDay, 'date_time')

  schedulingLock = true

  return knex('broadcast_schedules')
    .where({
      outboxed: knex.bool.false()
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
              const relTime = moment(`${schedule['date_time']}${sign}${tz}`, 'YYYY-MM-DD HH:mmZ').toDate()
              const adjustedTime = this.db.knex.date.format(schedule['ts'] ? schedule['ts'] : relTime)

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
                  scheduleId: schedule['id'],
                  adjustedTime,
                  initialTz
                })
                .then()
            })
          })
          .then(() => {
            return knex('broadcast_outbox')
              .where({ scheduleId: schedule['id'] })
              .select(knex.raw('count(*) as count'))
              .then()
              .get(0)
              .then(({ count }) => {
                return knex('broadcast_schedules')
                  .where({ id: schedule['id'] })
                  .update({
                    outboxed: knex.bool.true(),
                    total_count: count
                  })
                  .then(() => {
                    bp.logger.info('Scheduled broadcast #' + schedule['id'], '. [' + count + ' messages]')

                    if (schedule['filters'] && JSON.parse(schedule['filters']).length > 0) {
                      bp.logger.info(
                        `Filters found on broadcast #${schedule['id']}. Filters are applied at sending time.`
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
          bp.logger.warn('Filter returned something other ' + 'than a boolean (or a Promise of a boolean)')
        }

        return typeof v !== 'undefined' && v !== null && v !== true
      })
    })
  }

  return dropPromise.then(drop => {
    if (drop) {
      bp.logger.debug(`Drop sending #${row.scheduleId} to user: ${row.userId}. Reason = Filters`)
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

  const isPast = knex.date.isBefore(knex.raw('"broadcast_outbox"."ts"'), knex.date.now())

  knex('broadcast_outbox')
    .where(isPast)
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
              .where({ userId: row['scheduleUser'], scheduleId: row['scheduleId'] })
              .delete()
              .then(() => {
                return knex('broadcast_schedules')
                  .where({ id: row['scheduleId'] })
                  .update({ sent_count: knex.raw('sent_count + 1') })
                  .then(() => emitChanged())
              })
          })
          .catch(err => {
            abort = true

            bp.logger.error(`Broadcast #${row['scheduleId']}' failed. Broadcast aborted. Reason: ${err.message}`)

            bp.notifications.send({
              level: 'error',
              message: 'Broadcast #' + row['scheduleId'] + ' failed.' + ' Please check logs for the reason why.',
              url: '/logs'
            })

            return knex('broadcast_schedules')
              .where({ id: row['scheduleId'] })
              .update({
                errored: knex.bool.true()
              })
              .then(() => {
                return knex('broadcast_outbox')
                  .where({ scheduleId: row['scheduleId'] })
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

export default (bp: SDK, db: Database) => {
  initialize(bp, db)

  setInterval(scheduleToOutbox, SCHEDULE_TO_OUTBOX_INTERVAL)
  setInterval(sendBroadcasts, SEND_BROADCAST_INTERVAL)
}

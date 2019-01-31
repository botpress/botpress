import Promise from 'bluebird'
import retry from 'bluebird-retry'
import _ from 'lodash'
import moment from 'moment'

import { SDK } from '.'
import Database from './db'

let schedulingLock = false
let sendingLock = false

const INTERVAL_BASE = 10 * 1000
const SCHEDULE_TO_OUTBOX_INTERVAL = INTERVAL_BASE * 1
const SEND_BROADCAST_INTERVAL = INTERVAL_BASE * 1

export default (bp: SDK, db: Database) => {
  // console.log('bp: ', bp)
  const emitChanged = () => ({})
  // NOTE: look as bp.events make other job
  // const emitChanged = _.throttle(() => {

  //   bp && bp.events.emit('broadcast.changed')
  // }, 1000)

  const _sendBroadcast = Promise.method(row => {
    let dropPromise = Promise.resolve(false)

    if (row.filters) {
      dropPromise = Promise.mapSeries(JSON.parse(row.filters), (filter: string) => {
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

    return dropPromise.then(async drop => {
      if (drop) {
        bp.logger.debug(`Drop sending #${row.scheduleId} to user: ${row.userId}. Reason = Filters`)
        return
      }

      const content = await bp.cms.getContentElement(db.botId, row.text)

      return bp.events.sendEvent(bp.IO.Event({
        botId: db.botId,
        channel: row.platform,
        target: row.userId,
        type: 'text',
        direction: 'outgoing',
        payload: content.formData
      }))
    })
  })

  function scheduleToOutbox() {
    if (!db.knex || schedulingLock) {
      return
    }

    const inFiveMinutes = moment()
      .add(5, 'minutes')
      .toDate()
    const endOfDay = moment(inFiveMinutes)
      .add(14, 'hours')
      .toDate()

    // TODO: rename both
    const upcomingFixedTime = db.knex.date.isAfter(inFiveMinutes, 'ts')
    const upcomingVariableTime = db.knex.date.isAfter(endOfDay, 'date_time')

    schedulingLock = true

    return db.getBroadcastSchedulesByTime(upcomingFixedTime, upcomingVariableTime)
      .then(schedules => {
        return Promise.map(schedules, schedule =>
          db.getUsersTimezone()
            .then(timezones => Promise.mapSeries(timezones, ({ timezone: tz }) =>
              db.setBroadcastOutbox(schedule, tz)
                .then(() =>
                  db.getOutboxCount(schedule)
                    .then(({ count }) =>
                      db.updateTotalCount(schedule, count)
                        .then(() => {
                          bp.logger.info('Scheduled broadcast #' + schedule['id'], '. [' + count + ' messages]')

                          if (schedule['filters'] && JSON.parse(schedule['filters']).length > 0) {
                            bp.logger.info(
                              `Filters found on broadcast #${schedule['id']}. Filters are applied at sending time.`
                            )
                          }

                          emitChanged()
                        })
                    )
                )
            )
            )
        )
      })
      .finally(() => {
        schedulingLock = false
      })
  }

  function sendBroadcasts() {
    if (!db.knex || sendingLock) {
      return
    }

    sendingLock = true

    const isPast = db.knex.date.isBefore(db.knex.raw('"broadcast_outbox"."ts"'), db.knex.date.now())

    db.getBroadcastOutbox(isPast)
      .then(broadcastRows => {
        let abort = false

        return Promise.mapSeries(broadcastRows, row => {
          if (abort) {
            return
          }
          // @ts-ignore
          const { scheduleId, scheduleUser } = row

          return retry(() => _sendBroadcast(row), {
            max_tries: 3,
            interval: 1000,
            backoff: 3
          })
            .then(() =>
              db.deleteBroadcastOutbox(scheduleUser, scheduleId)
                .then(() =>
                  db.increaseBroadcastSentCount(scheduleId)
                    .then(() => emitChanged())
                )
            )
            .catch(err => {
              abort = true

              bp.logger.error(`Broadcast #${scheduleId}' failed. Broadcast aborted. Reason: ${err.message}`)

              bp.notifications.create(db.botId, {
                botId: db.botId,
                level: 'error',
                message: 'Broadcast #' + row['scheduleId'] + ' failed.' + ' Please check logs for the reason why.'
              })

              return db.knex('broadcast_schedules')
                .where({ id: scheduleId })
                .update({
                  errored: db.knex.bool.true()
                })
                .then(() =>
                  db.deleteBroadcastOutboxById(scheduleId)
                    .then(() => emitChanged())
                )
            })
        })
      })
      .finally(() => {
        sendingLock = false
      })
  }

  setInterval(scheduleToOutbox, SCHEDULE_TO_OUTBOX_INTERVAL)
  setInterval(sendBroadcasts, SEND_BROADCAST_INTERVAL)
}

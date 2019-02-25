// @ts-ignore
import Promise from 'bluebird'
import retry from 'bluebird-retry'
import _ from 'lodash'
import moment from 'moment'

import { SDK } from '.'
import Database from './db'

const INTERVAL_BASE = 10 * 1000
const SCHEDULE_TO_OUTBOX_INTERVAL = INTERVAL_BASE * 1
const SEND_BROADCAST_INTERVAL = INTERVAL_BASE * 1

export default async (botId: string, bp: SDK, db: Database) => {
  const emitChanged = _.throttle(() => {
    bp.realtime.sendPayload(bp.RealTimePayload.forAdmins('broadcast.changed', {}))
  }, 1000)

  const _sendBroadcast = Promise.method((botId, row) => {
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
          if (!_.isBoolean(v)) {
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

      const content = await bp.cms.getContentElement(botId, row.text)

      return bp.events.sendEvent(
        bp.IO.Event({
          botId,
          channel: row.platform,
          target: row.userId,
          type: 'text',
          direction: 'outgoing',
          payload: content.formData
        })
      )
    })
  })

  const trySendBroadcast = async (broadcast, { scheduleUser, scheduleId }) => {
    await retry(() => _sendBroadcast(botId, broadcast), {
      max_tries: 3,
      interval: 1000,
      backoff: 3
    })

    await db.deleteBroadcastOutbox(scheduleUser, scheduleId)

    await db.increaseBroadcastSentCount(scheduleId)
  }

  const handleFailedSending = async (err, scheduleId) => {
    bp.logger.error(`Broadcast #${scheduleId}' failed. Broadcast aborted. Reason: ${err.message}`)

    bp.notifications.create(botId, {
      botId,
      level: 'error',
      message: 'Broadcast #' + scheduleId + ' failed.' + ' Please check logs for the reason why.'
    })

    await db.updateErrorField(scheduleId)

    await db.deleteBroadcastOutboxById(scheduleId)
  }

  async function scheduleToOutbox(botId) {
    const { schedulingLock } = await bp.kvs.get(botId, 'broadcast/lock/scheduling')

    if (!db.knex || schedulingLock) {
      return
    }

    const inFiveMinutes = moment()
      .add(5, 'minutes')
      .toDate()
    const endOfDay = moment(inFiveMinutes)
      .add(14, 'hours')
      .toDate()

    const upcomingFixedTime = db.knex.date.isAfter(inFiveMinutes, 'ts')
    const upcomingVariableTime = db.knex.date.isAfter(endOfDay, 'date_time')

    await bp.kvs.set(botId, 'broadcast/lock/scheduling', { schedulingLock: true })

    const schedules = await db.getBroadcastSchedulesByTime(botId, upcomingFixedTime, upcomingVariableTime)

    await Promise.map(schedules, async schedule => {
      const timezones = await db.getUsersTimezone()

      await Promise.mapSeries(timezones, async tz => {
        await db.setBroadcastOutbox(botId, schedule, tz)
        const { count } = await db.getOutboxCount(botId, schedule)

        await db.updateTotalCount(schedule, count)

        bp.logger.info('Scheduled broadcast #' + schedule['id'], '. [' + count + ' messages]')

        if (schedule['filters'] && JSON.parse(schedule['filters']).length > 0) {
          bp.logger.info(`Filters found on broadcast #${schedule['id']}. Filters are applied at sending time.`)
        }

        emitChanged()
      })
    })

    await bp.kvs.set(botId, 'broadcast/lock/scheduling', { schedulingLock: false })
  }

  async function sendBroadcasts(botId) {
    try {
      const { sendingLock } = await bp.kvs.get(botId, 'broadcast/lock/sending')

      if (!db.knex || sendingLock) {
        return
      }

      await bp.kvs.set(botId, 'broadcast/lock/sending', { sendingLock: true })

      const isPast = db.knex.date.isBefore(db.knex.raw('"broadcast_outbox"."ts"'), db.knex.date.now())

      const broadcasts = await db.getBroadcastOutbox(botId, isPast)
      let abort = false

      await Promise.mapSeries(broadcasts, async broadcast => {
        if (abort) {
          return
        }
        // @ts-ignore
        const { scheduleId, scheduleUser } = broadcast

        try {
          await trySendBroadcast(broadcast, { scheduleUser, scheduleId })
        } catch (err) {
          abort = true

          await handleFailedSending(err, scheduleId)
        } finally {
          emitChanged()
        }
      })
    } catch (error) {
      bp.logger.error('Broadcast sending error: ', error.message)
    } finally {
      await bp.kvs.set(botId, 'broadcast/lock/sending', { sendingLock: false })
    }
  }

  setInterval(scheduleToOutbox.bind(undefined, botId), SCHEDULE_TO_OUTBOX_INTERVAL)
  setInterval(sendBroadcasts.bind(undefined, botId), SEND_BROADCAST_INTERVAL)
}

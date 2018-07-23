import Promise from 'bluebird'

import db from './db'
import util from './util'
let timerInterval = null
let lock = false
let daemon = null

const createDaemon = bp => {
  const reschedule = task => {
    if (task.schedule_type.toLowerCase() === 'once') {
      return Promise.resolve(null)
    }

    const nextOccurence = util.getNextOccurence(task.schedule_type, task.schedule).toDate()

    return db(bp).scheduleNext(task.id, nextOccurence)
  }

  const runSingleTask = async expired => {
    await db(bp).updateTask(expired.taskId, 'executing', null, null)

    let result = null

    if (!expired.enabled) {
      bp.logger.debug('[scheduler] Skipped task ' + expired.taskId + '. Reason=disabled')
      await db(bp).updateTask(expired.taskId, 'skipped', null, null)
      return
    }

    const AsyncFunction = eval('Object.getPrototypeOf(async function() {}).constructor') // eslint-disable-line no-eval
    const fn = new AsyncFunction('bp', 'task', expired.action)

    bp.events.emit('scheduler.update')
    bp.events.emit('scheduler.started', expired)

    const fromDate = new Date()
    result = await fn(bp, expired)
    const untilDate = new Date()

    const returned = (result && result.toString && result.toString()) || result

    const logsQuery = {
      from: fromDate,
      until: untilDate,
      limit: 1000,
      start: 0,
      order: 'desc',
      fields: ['message']
    }

    const logs = await Promise.fromCallback(callback => bp.logger.query(logsQuery, callback))

    const flattenLogs = ((logs && logs.file && logs.file.map(x => x.message)) || []).join('\n')

    await db(bp).updateTask(expired.taskId, 'done', flattenLogs, returned)

    bp.events.emit('scheduler.update')
    bp.events.emit('scheduler.finished', expired)
  }

  const _run = async () => {
    const rescheduled = {}
    const list = await db(bp).listExpired()

    return Promise.mapSeries(list, expired => {
      return runSingleTask(expired)
        .catch(err => {
          bp.logger.error('[scheduler]', err.message, err.stack)
          bp.notifications.send({
            message:
              'An error occured while running task: ' + expired.taskId + '. Please check the logs for more info.',
            level: 'error'
          })
          return db(bp).updateTask(expired.taskId, 'error', null, null)
        })
        .finally(async () => {
          if (!rescheduled[expired.taskId]) {
            await reschedule(expired)
            rescheduled[expired.taskId] = true
          }
        })
    })
  }

  const run = () => {
    if (lock === true) {
      return
    }

    lock = true
    return _run().finally(() => {
      lock = false
    })
  }

  const revive = () => db(bp).reviveAllExecuting()

  const start = () => {
    clearInterval(timerInterval)
    timerInterval = setInterval(run, 5000)
  }

  const stop = () => clearInterval(timerInterval)

  return { start, stop, revive }
}

module.exports = bp => {
  if (!daemon) {
    daemon = createDaemon(bp)
  }

  return daemon
}

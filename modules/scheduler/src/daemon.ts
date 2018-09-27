import sdk from 'botpress/sdk'
import Bluebird from 'bluebird'

import Database from './db'
import util from './util'
import _ from 'lodash'

let daemon: Daemon = null

class Daemon {
  private db: Database = null
  private bp: typeof sdk = null
  private timerInterval = null
  private lock = false

  constructor(bp: typeof sdk, db: Database) {
    this.db = db
    this.bp = bp
  }

  private reschedule = task => {
    if (task.schedule_type.toLowerCase() === 'once') {
      return Bluebird.resolve(null)
    }

    const nextOccurence = util.getNextOccurence(task.schedule_type, task.schedule).toDate()

    return this.db.scheduleNext(task.id, nextOccurence)
  }

  private runSingleTask = async expired => {
    await this.db.updateTask(expired.taskId, 'executing', null, null)

    let result = null

    if (!expired.enabled) {
      this.bp.logger.debug('[scheduler] Skipped task ' + expired.taskId + '. Reason=disabled')
      await this.db.updateTask(expired.taskId, 'skipped', null, null)
      return
    }

    const AsyncFunction = eval('Object.getPrototypeOf(async function() {}).constructor') // eslint-disable-line no-eval
    const fn = new AsyncFunction('bp', 'task', expired.action)

    this.bp.realtime.sendPayload(this.bp.RealTimePayload.forVisitor(null, 'scheduler.update', null))
    this.bp.realtime.sendPayload(this.bp.RealTimePayload.forVisitor(null, 'scheduler.started', expired))

    const fromDate = new Date()
    result = await fn(this.bp, expired)
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

    //TODO Add logger query for db

    /*const logs = await Promise.fromCallback(callback => bp.logger.query(logsQuery, callback))
    const flattenLogs = ((logs && logs.file && logs.file.map(x => x.message)) || []).join('\n')
    await db(bp).updateTask(expired.taskId, 'done', flattenLogs, returned)*/

    this.bp.realtime.sendPayload(this.bp.RealTimePayload.forVisitor(null, 'scheduler.update', null))
    this.bp.realtime.sendPayload(this.bp.RealTimePayload.forVisitor(null, 'scheduler.started', expired))
  }

  private _run = async () => {
    const rescheduled = {}
    const list = await this.db.listExpired()

    return Promise.mapSeries(list, expired => {
      const taskId = _.get(expired, 'taskId')

      return this.runSingleTask(expired)
        .catch(err => {
          this.bp.logger.error('[scheduler]', err.message, err.stack)

          this.bp.notifications.send({
            message: 'An error occured while running task: ' + taskId + '. Please check the logs for more info.',
            level: 'error'
          })

          return this.db.updateTask(taskId, 'error', null, null)
        })
        .finally(async () => {
          if (!rescheduled[taskId]) {
            await this.reschedule(expired)
            rescheduled[taskId] = true
          }
        })
    })
  }

  private run = () => {
    if (this.lock === true) {
      return
    }

    this.lock = true
    return this._run().finally(() => {
      this.lock = false
    })
  }

  revive = () => this.db.reviveAllExecuting()

  start = () => {
    clearInterval(this.timerInterval)
    this.timerInterval = setInterval(this.run, 5000)
  }

  stop = () => clearInterval(this.timerInterval)
}

export default (bp: typeof sdk, db: Database) => {
  if (!daemon) {
    daemon = new Daemon(bp, db)
  }

  return daemon
}

import Bluebird from 'bluebird'
import _ from 'lodash'

import { SDK } from '.'
import Database from './db'
import util from './util'

let daemon: Daemon = undefined

class Daemon {
  private db: Database = undefined
  private bp: SDK = undefined
  private timerInterval = undefined
  private lock = false

  constructor(bp: SDK, db: Database) {
    this.db = db
    this.bp = bp
  }

  private reschedule = task => {
    if (task.schedule_type.toLowerCase() === 'once') {
      return Bluebird.resolve(undefined)
    }

    const nextOccurence = util.getNextOccurence(task.schedule_type, task.schedule).toDate()

    return this.db.scheduleNext(task.id, nextOccurence)
  }

  private runSingleTask = async expired => {
    await this.db.updateTask(expired.taskId, 'executing', undefined, undefined)

    let result = undefined

    if (!expired.enabled) {
      this.bp.logger.debug('Skipped task ' + expired.taskId + '. Reason=disabled')
      await this.db.updateTask(expired.taskId, 'skipped', undefined, undefined)
      return
    }

    const AsyncFunction = eval('Object.getPrototypeOf(async function() {}).constructor') // eslint-disable-line no-eval
    const fn = new AsyncFunction('bp', 'task', expired.action)

    this.bp.realtime.sendPayload(this.bp.RealTimePayload.forAdmins('scheduler.update', undefined))
    this.bp.realtime.sendPayload(this.bp.RealTimePayload.forAdmins('scheduler.started', expired))

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

    // TODO Add logger query for db

    /*const logs = await Promise.fromCallback(callback => bp.logger.query(logsQuery, callback))
    const flattenLogs = ((logs && logs.file && logs.file.map(x => x.message)) || []).join('\n')
    await db(bp).updateTask(expired.taskId, 'done', flattenLogs, returned)*/

    this.bp.realtime.sendPayload(this.bp.RealTimePayload.forAdmins('scheduler.update', undefined))
    this.bp.realtime.sendPayload(this.bp.RealTimePayload.forAdmins('scheduler.started', expired))
  }

  private _run = async () => {
    const rescheduled = {}
    const list = await this.db.listExpired()

    return Promise.mapSeries(list, expired => {
      const taskId = _.get(expired, 'taskId')

      return this.runSingleTask(expired)
        .catch(err => {
          this.bp.logger.attachError(err).error('Error running scheduled task ' + taskId)

          this.bp.notifications.create(undefined, {
            botId: undefined,
            message: 'An error occured while running task: ' + taskId + '. Please check the logs for more info.',
            level: 'error'
          })

          return this.db.updateTask(taskId, 'error', undefined, undefined)
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

export default (bp: SDK, db: Database) => {
  if (!daemon) {
    daemon = new Daemon(bp, db)
  }

  return daemon
}

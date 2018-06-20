import Promise from 'bluebird'
import nanoid from 'nanoid'
import moment from 'moment'
import { findIndex } from 'lodash'

import helpers from '../database/helpers'

const DEFAULTS = {
  timestampColumn: 'created_on'
}

const createJanitor = ({ db, logger, intervalMin = 1 }) => {
  const tasks = []
  let currentPromise = null

  // TODO: impplement `debuounce` param which, when set,
  // prevents the specific task form running too often
  // The goal is to have the interval reasonably low (1/5/10s)
  // for some tasks like dialog sessions
  // but don't run other tasks like logs more often than every 1/5/10min
  const runTask = async ({ table, ttl, timestampColumn }) => {
    logger.info(`[DB Janitor] Running for table "${table}"`)
    const knex = await db.get()
    const outdatedCondition = helpers(knex).date.isBefore(timestampColumn, moment().subtract(ttl, 'seconds'))
    return knex(table)
      .where(outdatedCondition)
      .del()
      .then()
  }

  const runTasks = () => {
    logger.debug('[DB Janitor] Running tasks')
    if (currentPromise) {
      // don't run the tasks if the previous batch didn't finish yet
      logger.debug('[DB Janitor] Skipping the current run, previous operation still running')
      return
    }
    currentPromise = Promise.each(tasks, runTask)
      .catch(err => {
        logger.error('[DB Janitor] Error:', err.message)
      })
      .finally(() => {
        currentPromise = null
      })
  }

  const intervalId = setInterval(runTasks, intervalMin * 60 * 1000)
  logger.info('[DB Janitor] Started')

  const add = opts => {
    logger.info(`[DB Janitor] Added table "${opts.table}"`)
    const id = nanoid()
    tasks.push(Object.assign({ id }, DEFAULTS, opts))
    return id
  }

  const remove = id => {
    const i = findIndex(tasks, { id })
    const [opts] = tasks.splice(i, 1)
    logger.info(`[DB Janitor] Removed table "${opts.table}"`)
  }

  const stop = () => {
    clearInterval(intervalId)
    logger.info('[DB Janitor] Stopped')
  }

  return { add, remove, stop }
}

export default createJanitor

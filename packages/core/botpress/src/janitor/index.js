import Promise from 'bluebird'
import nanoid from 'nanoid'
import moment from 'moment'
import ms from 'ms'
import { findIndex } from 'lodash'

import helpers from '../database/helpers'

const DEFAULTS = {
  timestampColumn: 'created_on'
}

/** The DB Janitor is the component that
 automatically clears old records from the specific tables
 according to the configuration.
 @namespace DbJanitor
 @example
 bp.janitor.add({...})
 */
const createJanitor = ({ db, logger, intervalMs = ms('1m') }) => {
  const tasks = []
  let currentPromise = null

  // TODO: impplement `debuounce` param which, when set,
  // prevents the specific task form running too often
  // The goal is to have the interval reasonably low (1/5/10s)
  // for some tasks like dialog sessions
  // but don't run other tasks like logs more often than every 1/5/10min
  const runTask = async ({ table, ttl, timestampColumn }) => {
    logger.debug(`[DB Janitor] Running for table "${table}"`)
    const knex = await db.get()
    const outdatedCondition = helpers(knex).date.isBefore(timestampColumn, moment().subtract(ttl, 'ms'))
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

  let intervalId = null

  /**
   * Start the daemon that will keep checking the DB and delete
   * the outdated records according to the config,
   * see {@link DbJanitor#add}.
   * @function DbJanitor#start
   * @returns {void}
   */
  const start = () => {
    if (intervalId) {
      return
    }
    intervalId = setInterval(runTasks, intervalMs)
    logger.info('[DB Janitor] Started')
  }

  /**
   * Add the table for the janitor to keep watching and cleaning.
   * @function DbJanitor#add
   * @param {object} options
   * @param {string} options.table The name of the DB table to watch.
   * @param {number} options.ttl Records Time to Live in **milliseconds**.
   * @param {string} [options.timestampColumn="created_on"] The column
   *  to check if the record is outdated.
   * @returns {string} The id of the added task.
   */
  const add = options => {
    logger.debug(`[DB Janitor] Added table "${options.table}"`)
    const id = nanoid()
    tasks.push(Object.assign({ id }, DEFAULTS, options))
    return id
  }

  /**
   * Remove the  table for the janitor to keep watching and cleaning.
   * @function DbJanitor#remove
   * @param {string} id The ID of the task returned by {@link DbJanitor#add}.
   * @returns {void}
   */
  const remove = id => {
    const i = findIndex(tasks, { id })
    if (i < 0) {
      logger.error(`[DB Janitor] Unknown task ID "${id}"`)
      return
    }
    const [{ table }] = tasks.splice(i, 1)
    logger.debug(`[DB Janitor] Removed table "${table}"`)
  }

  /**
   * Stop the daemon.
   * @function DbJanitor#stop
   * @returns {void}
   */
  const stop = () => {
    clearInterval(intervalId)
    intervalId = null
    logger.info('[DB Janitor] Stopped')
  }

  return { start, add, remove, stop }
}

export default createJanitor

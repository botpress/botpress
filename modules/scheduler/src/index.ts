import sdk from 'botpress/sdk'
import _ from 'lodash'
import SchedulerDb from './db'
import Daemon from './daemon'
import api from './api'

export type Extension = {
  scheduler: {
    /**
     * Adds schedule record and returns promise with id of the record inserted
     * @param  {string} params.schedule dateTime action will be executed
     * @param  {string} params.action string that will be executed
     * @param  {string} [params.id] the unique id of the schedule (if not provided will be generated automatically)
     * @param  {boolean} [params.enabled=true] optional flag specifying whether this task is enabled
     * @param  {string} [scheduleType='once'] type of the scheduler: 'once', 'cron' or 'natural'
     */
    add: Function

    /**
     * Removes schedule record and returns promise with boolean showing whether delete was successful
     * @param  {string} id the id of the schedule to remove
     */
    remove: Function
  }
}

let db = null

export const onInit = async (bp: typeof sdk & Extension) => {
  db = new SchedulerDb(bp)
  await db.initialize()

  const daemon = Daemon(bp, db)
  await daemon.revive()
  daemon.start()
}

export const onReady = async (bp: typeof sdk & Extension) => {
  await api(bp, db)
}

//export const config: {}

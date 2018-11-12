import 'bluebird-global'
import sdk from 'botpress/sdk'
import _ from 'lodash'

import api from './api'
import Daemon from './daemon'
import SchedulerDb from './db'

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

export type SDK = typeof sdk & Extension

let db = undefined

const onServerStarted = async (bp: typeof sdk & Extension) => {
  db = new SchedulerDb(bp)
  await db.initialize()

  const daemon = Daemon(bp, db)
  await daemon.revive()
  daemon.start()
}

const onServerReady = async (bp: typeof sdk & Extension) => {
  await api(bp, db)
}

const obj: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  definition: {
    name: 'scheduler',
    menuIcon: 'alarm_on',
    fullName: 'Scheduler',
    homepage: 'https://botpress.io',
    noInterface: false,
    plugins: [],
    moduleView: { stretched: true }
  }
}

export default obj

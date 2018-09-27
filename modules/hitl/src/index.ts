import _ from 'lodash'
import * as sdk from 'botpress/sdk'
import HitlDb from './db'
import mware from './mware'
import api from './api'

// TODO: Cleanup old sessions
// TODO: If messages count > X, delete some

let db = null

export type Extension = {
  hitl: {}
}

export const config = {
  sessionExpiry: { type: 'string', default: '3 days' },
  paused: { type: 'bool', default: false, env: 'BOTPRESS_HITL_PAUSED' }
}

export const onInit = async (bp: typeof sdk & Extension) => {
  bp['hitl'] = {}

  db = new HitlDb(bp)
  await db.initialize()
  await mware(bp, db, config)
}

export const onReady = async (bp: typeof sdk & Extension) => {
  await api(bp, db)
}

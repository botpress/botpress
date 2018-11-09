import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'

import api from './api'
import HitlDb from './db'
import setup from './setup'

// TODO: Cleanup old sessions
// TODO: If messages count > X, delete some

let db = undefined

export type SDK = typeof sdk

const onServerStarted = async (bp: SDK) => {
  db = new HitlDb(bp)
  await db.initialize()
  await setup(bp, db)
}

const onServerReady = async (bp: SDK) => {
  await api(bp, db)
}

const config: sdk.ModuleConfig = {
  sessionExpiry: { type: 'string', required: false, default: '3 days' },
  paused: { type: 'bool', required: false, default: false, env: 'BOTPRESS_HITL_PAUSED' }
}

const defaultConfigJson = `
{
  "paused": false,
  "sessionExpiry": "3 days"
}
`

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  config,
  defaultConfigJson,
  definition: {
    name: 'hitl',
    menuIcon: 'feedback',
    menuText: 'HITL',
    fullName: 'Human In The Loop',
    homepage: 'https://botpress.io'
  }
}

export default entryPoint

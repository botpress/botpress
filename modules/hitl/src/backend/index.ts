import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'

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

const onModuleUnmount = async (bp: typeof sdk) => {
  bp.events.removeMiddleware('hitl.captureInMessages')
  bp.events.removeMiddleware('hitl.captureOutMessages')
  bp.http.deleteRouterForBot('hitl')
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onModuleUnmount,
  definition: {
    name: 'hitl',
    menuIcon: 'feedback',
    menuText: 'HITL',
    fullName: 'Human In The Loop',
    homepage: 'https://botpress.io'
  }
}

export default entryPoint

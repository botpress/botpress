import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import en from '../translations/en.json'
import fr from '../translations/fr.json'

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
  translations: { en, fr },
  definition: {
    name: 'hitl',
    menuIcon: 'headset',
    menuText: 'HITL',
    fullName: 'Human In The Loop',
    homepage: 'https://botpress.com'
  }
}

export default entryPoint

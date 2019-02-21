import 'bluebird-global'

// @ts-ignore
import * as sdk from 'botpress/sdk'

import api from './api'

import Daemon from './daemon'
import BroadcastDb from './db'

export type Extension = {}

export type SDK = typeof sdk & Extension

let db

const onServerStarted = async (bp: SDK) => {
  db = new BroadcastDb(bp)
  await db.initialize()
}

const onServerReady = async (bp: SDK) => {
  await api(bp, db)
}

const onBotMount = async (bp: SDK, botId: string) => {
  await bp.kvs.set(botId, 'broadcast/lock/sending', { sendingLock: false })
  await bp.kvs.set(botId, 'broadcast/lock/scheduling', { schedulingLock: false })

  await Daemon(botId, bp, db)
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  definition: {
    name: 'broadcast',
    menuIcon: 'settings_input_antenna',
    menuText: 'Broadcast',
    fullName: 'Broadcast',
    homepage: 'https://botpress.io'
  }
}

export default entryPoint

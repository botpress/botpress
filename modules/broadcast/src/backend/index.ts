import 'bluebird-global'

// @ts-ignore
import * as sdk from 'botpress/sdk'

import api from './api'

import Daemon from './daemon'
import BroadcastDb from './db'

export type Extension = {}

export type SDK = typeof sdk & Extension

const onServerStarted = async (bp: SDK) => { }

const onServerReady = async (bp: SDK) => { }

const onBotMount = async (bp: SDK, botId: string) => {
  const db = new BroadcastDb(bp, botId)
  await db.initialize()

  Daemon(bp, db)

  await api(bp, db)
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

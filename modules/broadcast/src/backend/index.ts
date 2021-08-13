import 'bluebird-global'
import * as sdk from 'botpress/sdk'

import en from '../translations/en.json'
import es from '../translations/es.json'
import fr from '../translations/fr.json'

import api from './api'
import Daemon from './daemon'
import BroadcastDb from './db'

let db

const onServerStarted = async (bp: typeof sdk) => {
  db = new BroadcastDb(bp)
  await db.initialize()
}

const onServerReady = async (bp: typeof sdk) => {
  await api(bp, db)
}

const onBotMount = async (bp: typeof sdk, botId: string) => {
  await Daemon(botId, bp, db)
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  translations: { en, fr, es },
  definition: {
    name: 'broadcast',
    menuIcon: 'cell-tower',
    menuText: 'Broadcast',
    fullName: 'Broadcast',
    homepage: 'https://botpress.com'
  }
}

export default entryPoint

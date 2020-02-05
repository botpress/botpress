import * as sdk from 'botpress/sdk'

import api from './api'
import db from './db'

const onServerStarted = async (bp: typeof sdk) => {
  await db(bp).initialize()
}

const onServerReady = async (bp: typeof sdk) => {
  await api(bp, db(bp))
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  definition: {
    name: 'bot-improvement',
    menuIcon: 'thumbs_up_down',
    menuText: 'Bot Improvement',
    noInterface: false,
    fullName: 'Bot Improvement',
    homepage: 'https://botpress.io'
  }
}

export default entryPoint

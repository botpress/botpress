import 'bluebird-global'
import * as sdk from 'botpress/sdk'

import api from './api'
import Database from './db'

const onServerStarted = async (bp: typeof sdk) => {}

const onServerReady = async (bp: typeof sdk) => {
  const db = new Database(bp)
  db.initialize()
  api(bp, db)
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerReady,
  onServerStarted,
  definition: {
    name: 'history',
    fullName: 'History',
    menuText: 'History',
    homepage: 'https://botpress.io',
    menuIcon: 'history',
    experimental: true
  }
}

export default entryPoint

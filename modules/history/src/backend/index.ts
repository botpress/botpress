import 'bluebird-global'
import * as sdk from 'botpress/sdk'

import api from './api'
import Database from './db'

const onServerStarted = async (bp: typeof sdk) => {
  const db = new Database(bp)
  db.initialize()

  api(bp, db)
}

const onServerReady = async (bp: typeof sdk) => {}

const onBotMount = async (bp: typeof sdk) => {}

const onBotUnmount = async (bp: typeof sdk) => {}

const onModuleUnmount = async (bp: typeof sdk) => {}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerReady,
  onServerStarted,
  onBotMount,
  onBotUnmount,
  onModuleUnmount,
  definition: {
    name: 'history',
    fullName: 'History',
    homepage: 'https://botpress.io',
    menuIcon: 'history'
  }
}

export default entryPoint

import * as sdk from 'botpress/sdk'

import initApi from './api'
import Db from './db'

const onServerStarted = async (bp: typeof sdk) => {}

const onServerReady = async (bp: typeof sdk) => {
  const db = new Db(bp)
  await db.initialize()
  await initApi(bp, db)
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  definition: {
    name: 'misunderstood',
    menuIcon: 'gesture',
    menuText: 'Misunderstood',
    noInterface: false,
    fullName: 'Misunderstood Phrases',
    homepage: 'https://botpress.io'
  }
}

export default entryPoint

import * as sdk from 'botpress/sdk'

import initApi from './api'
import Db from './db'

const onServerReady = async (bp: typeof sdk) => {
  const db = new Db(bp)
  await db.initialize()
  await initApi(bp, db)
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerReady,
  definition: {
    name: 'misunderstood',
    menuIcon: 'gesture',
    menuText: 'Misunderstood',
    fullName: 'Misunderstood Phrases',
    homepage: 'https://botpress.io'
  }
}

export default entryPoint

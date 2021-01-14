import 'bluebird-global'
import * as sdk from 'botpress/sdk'

import Database from './db';
import api from './api';

let db: Database;

const onServerStarted = async (bp: typeof sdk) => {
  db = new Database(bp)
  await db.initialize()
}

const onServerReady = async (bp: typeof sdk) => {
  await api(bp, db)
}

const onModuleUnmount = async (bp: typeof sdk) => {
  bp.http.deleteRouterForBot('users')
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onModuleUnmount,
  definition: {
    name: 'api-client',
    fullName: 'ApiClient',
    homepage: 'https://botpress.com',
    menuIcon: 'timeline-line-chart',
    menuText: 'ApiClient'
  }
}

export default entryPoint

import 'bluebird-global'
import * as sdk from 'botpress/sdk'

import Migration from '../migrations'

import api from './api'
import WebchatDatabase from './db'
import socket from './socket'

const onServerStarted = async (bp: typeof sdk) => {
  const db = new WebchatDatabase(bp)
  await db.initialize()

  await api(bp, db)
  await socket(bp, db)
}

const onServerReady = async (bp: typeof sdk) => {}

const onModuleUnmount = async (bp: typeof sdk) => {
  bp.events.removeMiddleware('web.sendMessages')
  bp.http.deleteRouterForBot('channel-web')
}

const onMigrationRequest = async (bp: typeof sdk, dryRun?: boolean) => {
  const migration = new Migration()
  return migration.execute(dryRun)
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onModuleUnmount,
  onMigrationRequest,
  definition: {
    name: 'channel-web',
    menuIcon: 'chrome_reader_mode',
    fullName: 'Web Chat',
    homepage: 'https://botpress.io',
    noInterface: true,
    plugins: [{ entry: 'WebBotpressUIInjection', position: 'overlay' }]
  }
}

export default entryPoint

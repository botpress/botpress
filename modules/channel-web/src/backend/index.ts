import 'bluebird-global'
import * as sdk from 'botpress/sdk'

import api from './api'
import WebchatDatabase from './db'
import socket from './socket'

const onServerStarted = async (bp: typeof sdk) => {
  const db = new WebchatDatabase(bp)

  await api(bp, db)
  await socket(bp)
}

const onModuleUnmount = async (bp: typeof sdk) => {
  bp.events.removeMiddleware('web.sendMessages')
  bp.http.deleteRouterForBot('channel-web')
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onModuleUnmount,
  definition: {
    name: 'channel-web',
    menuIcon: 'chrome_reader_mode',
    fullName: 'Web Chat',
    homepage: 'https://botpress.com',
    noInterface: true,
    plugins: [{ entry: 'WebBotpressUIInjection', position: 'overlay' }]
  }
}

export default entryPoint

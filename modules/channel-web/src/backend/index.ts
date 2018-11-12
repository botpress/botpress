import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import fs from 'fs'
import path from 'path'

import api from './api'
import WebchatDatabase from './db'
import socket from './socket'

export type Extension = {
  'channel-web': {}
}

export type SDK = typeof sdk & Extension

const onServerStarted = async (bp: SDK) => {
  bp['channel-web'] = {}

  const db = new WebchatDatabase(bp)
  await db.initialize()

  await api(bp, db)
  await socket(bp, db)
}

const onServerReady = async (bp: SDK) => {}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
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

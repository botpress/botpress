import 'bluebird-global'

import * as sdk from 'botpress/sdk'
import fs from 'fs'
import path from 'path'

import api from './api'

import Daemon from './daemon'
import BroadcastDb from './db'

export type Extension = {}

export type SDK = typeof sdk & Extension

let db = undefined

const onServerStarted = async (bp: SDK) => {
  db = new BroadcastDb(bp)
  await db.initialize()

  Daemon(bp, db)
}

const onServerReady = async (bp: SDK) => {
  await api(bp, db)
}

const serveFile = async (filePath: string): Promise<Buffer> => {
  filePath = filePath.toLowerCase()

  const mapping = {
    'index.js': path.join(__dirname, '../web/web.bundle.js')
  }

  // Web views
  if (mapping[filePath]) {
    return fs.readFileSync(mapping[filePath])
  }

  return new Buffer('')
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  config: {},
  serveFile,
  definition: {
    name: 'broadcast',
    menuIcon: 'settings_input_antenna',
    menuText: 'Broadcast',
    fullName: 'Broadcast',
    homepage: 'https://botpress.io'
  }
}

export default entryPoint

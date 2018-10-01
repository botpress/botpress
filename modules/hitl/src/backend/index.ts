import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'

import api from './api'
import HitlDb from './db'
import mware from './mware'

// TODO: Cleanup old sessions
// TODO: If messages count > X, delete some

let db = undefined

export type Extension = {
  hitl: {
    pause: Function
    unpause: Function
    isPaused: Function
  }
}

export type SDK = typeof sdk & Extension

const config: sdk.ModuleConfig = {
  sessionExpiry: { type: 'string', required: false, default: '3 days' },
  paused: { type: 'bool', required: false, default: false, env: 'BOTPRESS_HITL_PAUSED' }
}

const onInit = async (bp: SDK) => {
  db = new HitlDb(bp)
  await db.initialize()
  await mware(bp, db, config)
}

const onReady = async (bp: SDK) => {
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

const obj: sdk.ModuleEntryPoint = {
  onInit,
  onReady,
  config,
  serveFile,
  definition: {
    name: 'hitl',
    menuIcon: 'feedback',
    fullName: 'HITL',
    homepage: 'https://botpress.io',
    noInterface: false,
    plugins: [],
    moduleView: { stretched: true }
  }
}

export default obj

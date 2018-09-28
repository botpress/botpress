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

export const config = {
  sessionExpiry: { type: 'string', default: '3 days' },
  paused: { type: 'bool', default: false, env: 'BOTPRESS_HITL_PAUSED' }
}

export const onInit = async (bp: typeof sdk & Extension) => {
  db = new HitlDb(bp)
  await db.initialize()
  await mware(bp, db, config)
}

export const onReady = async (bp: typeof sdk & Extension) => {
  await api(bp, db)
}

export const serveFile = async (filePath: string): Promise<Buffer> => {
  filePath = filePath.toLowerCase()

  const mapping = {
    'index.js': path.join(__dirname, '../web/web.bundle.js'),
    // 'embedded.js': path.join(__dirname, '../web/embedded.bundle.js'),
    'fullscreen.js': path.join(__dirname, '../web/fullscreen.bundle.js')
  }

  // Web views
  if (mapping[filePath]) {
    return fs.readFileSync(mapping[filePath])
  }

  return new Buffer('')
}

import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'

import Analytics from './analytics'
import api from './api'
import CustomAnalytics from './custom-analytics'

import setup from './setup'

let analytics = undefined

export type Extension = {
  analytics: {
    custom: {
      getAll: Function
    }
  }
}

export type SDK = typeof sdk & Extension

const interactionsToTrack = ['message', 'text', 'button', 'template', 'quick_reply', 'postback']

const onInit = async (bp: SDK) => {
  bp.analytics = {
    custom: CustomAnalytics({ bp })
  }

  await setup(bp, interactionsToTrack)

  analytics = new Analytics(bp)
}

const onReady = async (bp: SDK) => {
  await api(bp, analytics)
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

  return Buffer.from('')
}

const entryPoint: sdk.ModuleEntryPoint = {
  onInit,
  onReady,
  serveFile,
  config: {},
  definition: {
    name: 'analytics',
    fullName: 'Analytics',
    homepage: 'https://botpress.io',
    menuIcon: 'timeline'
  }
}

export default entryPoint

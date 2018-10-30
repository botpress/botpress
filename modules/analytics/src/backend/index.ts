import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'

import Analytics from './analytics'
import api from './api'
import CustomAnalytics from './custom-analytics'
import setup from './setup'

const scopedAnalytics: Map<string, Analytics> = new Map<string, Analytics>()

export type Extension = {
  analytics: {
    custom: {
      getAll: Function
    }
  }
}

export type SDK = typeof sdk & Extension

const interactionsToTrack = ['message', 'text', 'button', 'template', 'quick_reply', 'postback']

const onServerStarted = async (bp: SDK) => {
  bp.analytics = {
    custom: CustomAnalytics({ bp })
  }

  await setup(bp, interactionsToTrack)
}

const onServerReady = async (bp: SDK) => {}

const onBotMount = async (bp: SDK, botId: string) => {
  const analytics = new Analytics(bp, botId)
  scopedAnalytics.set(botId, analytics)

  await api(bp, analytics)
  await analytics.start()
}

const onBotUnmount = async (bp: SDK, botId: string) => {
  const analytics = scopedAnalytics.get(botId)
  await analytics.stop()
  scopedAnalytics.delete(botId)
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
  onServerStarted,
  onServerReady,
  onBotMount,
  onBotUnmount,
  serveFile,
  config: {},
  definition: {
    name: 'analytics',
    fullName: 'Analytics',
    homepage: 'https://botpress.io',
    menuIcon: 'timeline',
    menuText: 'Analytics'
  }
}

export default entryPoint

import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import Analytics from './analytics'
import api from './api'
import CustomAnalytics from './custom-analytics'
import setup from './setup'
import { AnalyticsByBot } from './typings'

const analyticsByBot: AnalyticsByBot = {}

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

const onServerReady = async (bp: SDK) => {
  await api(bp, analyticsByBot)
}

const onBotMount = async (bp: SDK, botId: string) => {
  const analytics = new Analytics(bp, botId)
  analyticsByBot[botId] = analytics
  await analytics.start()
}

const onBotUnmount = async (bp: SDK, botId: string) => {
  await analyticsByBot[botId].stop()
  delete analyticsByBot[botId]
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  onBotUnmount,
  definition: {
    name: 'analytics',
    fullName: 'Analytics',
    homepage: 'https://botpress.io',
    menuIcon: 'timeline',
    menuText: 'Analytics'
  }
}

export default entryPoint

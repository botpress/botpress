import 'bluebird-global'
import { SDK } from 'botpress'
import _ from 'lodash'

import Analytics from './analytics'
import api from './api'
import setup from './setup'
import { AnalyticsByBot } from './typings'

const analyticsByBot: AnalyticsByBot = {}

const interactionsToTrack = ['message', 'text', 'button', 'template', 'quick_reply', 'postback']

const onServerStarted = async (bp: SDK) => {
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

const entryPoint: SDK.ModuleEntryPoint = {
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

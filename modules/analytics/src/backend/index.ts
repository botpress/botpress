import 'bluebird-global'
import * as sdk from 'botpress'
import _ from 'lodash'

import Analytics from './analytics'
import api from './api'
import setup from './setup'
import { AnalyticsByBot } from './typings'

const analyticsByBot: AnalyticsByBot = {}

const interactionsToTrack = ['message', 'text', 'button', 'template', 'quick_reply', 'postback']

const onServerStarted = async (bp: typeof sdk) => {
  await setup(bp, interactionsToTrack)
}

const onServerReady = async (bp: typeof sdk) => {
  await api(bp, analyticsByBot)
}

const onBotMount = async (bp: typeof sdk, botId: string) => {
  const analytics = new Analytics(bp, botId)
  analyticsByBot[botId] = analytics
  await analytics.start()
}

const onBotUnmount = async (bp: typeof sdk, botId: string) => {
  await analyticsByBot[botId].stop()
  delete analyticsByBot[botId]
}

const onModuleUnmount = async (bp: typeof sdk) => {
  bp.events.removeMiddleware('analytics.incoming')
  bp.events.removeMiddleware('analytics.outgoing')
  bp.http.deleteRouterForBot('analytics')
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  onBotUnmount,
  onModuleUnmount,
  definition: {
    name: 'analytics',
    fullName: 'Analytics',
    homepage: 'https://botpress.io',
    menuIcon: 'timeline',
    menuText: 'Analytics'
  }
}

export default entryPoint

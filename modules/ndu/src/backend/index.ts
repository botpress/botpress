import * as sdk from 'botpress/sdk'

import api from './api'
import { registerMiddleware } from './middleware'
import { UnderstandingEngine } from './ndu-engine'
import Storage from './storage'
import { BotStorage } from './typings'

let nduEngine: UnderstandingEngine
const bots: BotStorage = {}

const onServerStarted = async (bp: typeof sdk) => {
  nduEngine = new UnderstandingEngine(bp)
  await registerMiddleware(bp, nduEngine, bots)
}

const onServerReady = async (bp: typeof sdk) => {
  await api(bp, bots)
}

const onBotMount = async (bp: typeof sdk, botId: string) => {
  const botConfig = await bp.bots.getBotById(botId)
  if (botConfig['oneflow']) {
    bots[botId] = new Storage(bp, botId)
  }
}

const onBotUnmount = async (bp: typeof sdk, botId: string) => {
  delete bots[botId]
}

const onFlowChanged = async (bp: typeof sdk, botId: string, flow: sdk.Flow) => {
  await nduEngine.invalidateGoals(botId)
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  onBotUnmount,
  onFlowChanged,
  definition: {
    name: 'ndu',
    menuIcon: 'none',
    menuText: 'NDU',
    noInterface: false,
    fullName: 'NDU',
    homepage: 'https://botpress.io'
  }
}

export default entryPoint

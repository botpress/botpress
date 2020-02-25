import * as sdk from 'botpress/sdk'

import api from './api'
import Database from './db'
import { registerMiddleware } from './middleware'
import { UnderstandingEngine } from './ndu-engine'
import Storage from './storage'
import { BotStorage } from './typings'

let nduEngine: UnderstandingEngine
const bots: BotStorage = {}
let db: Database

const onServerStarted = async (bp: typeof sdk) => {
  db = new Database(bp)
  await db.initialize()

  nduEngine = new UnderstandingEngine(bp, db)
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

const botTemplates: sdk.BotTemplate[] = [{ id: 'oneflow', name: 'Test bot', desc: `Test bot` }]

const onFlowChanged = async (bp: typeof sdk, botId: string, flow: sdk.Flow) => {
  await nduEngine.invalidateGoals(botId)
}

const onModuleUnmount = async (bp: typeof sdk) => {
  bp.events.removeMiddleware('ndu.incoming')
  bp.http.deleteRouterForBot('ndu')
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  onBotUnmount,
  onModuleUnmount,
  onFlowChanged,
  botTemplates,
  definition: {
    name: 'ndu',
    menuIcon: 'poll',
    menuText: 'NDU',
    noInterface: false,
    fullName: 'NDU',
    homepage: 'https://botpress.io'
  }
}

export default entryPoint

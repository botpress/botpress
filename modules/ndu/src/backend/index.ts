import * as sdk from 'botpress/sdk'

import { conditionsDefinitions } from './conditions'
import Database from './db'
import { registerMiddleware } from './middleware'
import { UnderstandingEngine } from './ndu-engine'
import { MountedBots } from './typings'

let nduEngine: UnderstandingEngine
const bots: MountedBots = {}
let db: Database

const onServerStarted = async (bp: typeof sdk) => {
  db = new Database(bp)
  await db.initialize()

  nduEngine = new UnderstandingEngine(bp, db)
  await registerMiddleware(bp, nduEngine, bots)
}

const onServerReady = async (bp: typeof sdk) => {
  const router = bp.http.createRouterForBot('ndu')

  router.get('/conditions', async (req, res) => {
    res.send(conditionsDefinitions)
  })

  router.get('/events', async (req, res) => {
    res.send(
      await bp
        .database('events')
        .select('*')
        .where({ botId: req.params.botId, direction: 'incoming' })
        .orderBy('createdOn', 'desc')
        .limit(100)
    )
  })
}

const onBotMount = async (bp: typeof sdk, botId: string) => {
  const botConfig = await bp.bots.getBotById(botId)
  if (botConfig['oneflow']) {
    bots[botId] = true
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

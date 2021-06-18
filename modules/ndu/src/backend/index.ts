import * as sdk from 'botpress/sdk'

import { Config } from '../config'

import api from './api'
import { dialogConditions } from './conditions'
import { registerMiddleware } from './middleware'
import { UnderstandingEngine } from './ndu-engine'
import { MountedBots } from './typings'

export const bots: MountedBots = {}

export let conditions: sdk.Condition[] = []

const onServerStarted = async (bp: typeof sdk) => {
  await registerMiddleware(bp, bots)
}

const onServerReady = async (bp: typeof sdk) => {
  // Must be in onServerReady so all modules have registered their conditions
  conditions = bp.dialog.getConditions()
  await api(bp)
}

const onBotMount = async (bp: typeof sdk, botId: string) => {
  const botConfig = await bp.bots.getBotById(botId)
  if (botConfig.oneflow) {
    const config = (await bp.config.getModuleConfigForBot('ndu', botId)) as Config
    bots[botId] = new UnderstandingEngine(bp, conditions, config)
  }
}

const onBotUnmount = async (bp: typeof sdk, botId: string) => {
  delete bots[botId]
}

const botTemplates: sdk.BotTemplate[] = [{ id: 'oneflow', name: 'Test bot', desc: 'Test bot' }]

const onFlowChanged = async (bp: typeof sdk, botId: string, flow: sdk.Flow) => {
  if (bots[botId]) {
    await bots[botId].invalidateWorkflows(botId)
  }
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
  dialogConditions,
  definition: {
    name: 'ndu',
    menuText: 'NDU',
    noInterface: true,
    fullName: 'NDU',
    homepage: 'https://botpress.io'
  }
}

export default entryPoint

import * as sdk from 'botpress/sdk'
import { file } from 'tmp'

import { Config } from '../config'
import en from '../translations/en.json'
import fr from '../translations/fr.json'

import api from './api'
import { dialogConditions } from './conditions'
import { registerMiddleware } from './middleware'
import { UnderstandingEngine } from './ndu-engine'
import { getModel } from './training/trainer'
import { MountedBots } from './typings'

export const bots: MountedBots = {}

export let conditions: sdk.Condition[] = []
export let broadcastLoadModel: Function

const onServerStarted = async (bp: typeof sdk) => {
  await registerMiddleware(bp, bots)
}

const onServerReady = async (bp: typeof sdk) => {
  // Must be in onServerReady so all modules have registered their conditions
  conditions = bp.dialog.getConditions()
  await api(bp)

  const loadModel = async (botId: string, hash: string) => {
    if (!bots[botId]) {
      bp.logger.warn(`Can't load model for unmounted bot ${botId}`)
      return
    }

    const model = await getModel(bp.ghost.forBot(botId), hash)
    if (model) {
      await bots[botId].loadModel(model)
    }
  }

  broadcastLoadModel = await bp.distributed.broadcast(loadModel)
}

const onBotMount = async (bp: typeof sdk, botId: string) => {
  const botConfig = await bp.bots.getBotById(botId)

  if (botConfig.oneflow) {
    const config = (await bp.config.getModuleConfigForBot('ndu', botId)) as Config
    bots[botId] = new UnderstandingEngine(bp, botId, conditions, config)

    // when QnA changes we invalidate
    bp.ghost.forBot(botId).onFileChanged(async filePath => {
      if (/\/__qna__[A-Z0-9_-]+\.json$/i.test(filePath)) {
        await bots[botId].invalidateWorkflows()
      }
    })
  }
}

const onBotUnmount = async (bp: typeof sdk, botId: string) => {
  delete bots[botId]
}

const botTemplates: sdk.BotTemplate[] = [{ id: 'oneflow', name: 'Test bot', desc: 'Test bot' }]

const onFlowChanged = async (bp: typeof sdk, botId: string, flow: sdk.Flow) => {
  if (bots[botId]) {
    await bots[botId].invalidateWorkflows()
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
  translations: { en, fr },
  definition: {
    name: 'ndu',
    menuIcon: 'poll',
    menuText: 'NDU',
    noInterface: true,
    fullName: 'NDU',
    homepage: 'https://botpress.io'
  }
}

export default entryPoint

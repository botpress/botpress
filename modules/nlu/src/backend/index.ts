import 'bluebird-global'
import * as sdk from 'botpress/sdk'

import { Config } from '../config'

import api from './api'
import { registerMiddleware } from './middleware'

import ConfusionEngine from './confusion-engine'
import models from './models'
import { DucklingEntityExtractor } from './pipelines/entities/duckling_extractor'
import Storage from './storage'
import { EngineByBot } from './typings'

const nluByBot: EngineByBot = {}

const onServerStarted = async (bp: typeof sdk) => {
  Storage.ghostProvider = (botId?: string) => (botId ? bp.ghost.forBot(botId) : bp.ghost.forGlobal())

  const globalConfig = (await bp.config.getModuleConfig('nlu')) as Config
  await DucklingEntityExtractor.configure(globalConfig.ducklingEnabled, globalConfig.ducklingURL, bp.logger)

  await registerMiddleware(bp, nluByBot)
}

const onServerReady = async (bp: typeof sdk) => {
  await api(bp, nluByBot)
  await models(bp)
}

const onBotMount = async (bp: typeof sdk, botId: string) => {
  const moduleBotConfig = (await bp.config.getModuleConfigForBot('nlu', botId)) as Config
  const scoped = new ConfusionEngine(bp.logger, botId, moduleBotConfig, bp.MLToolkit)
  await scoped.init()
  nluByBot[botId] = scoped
}

const onBotUnmount = async (bp: typeof sdk, botId: string) => {
  delete nluByBot[botId]
}

const onModuleUnmount = async (bp: typeof sdk) => {
  bp.events.removeMiddleware('nlu.incoming')
  bp.http.deleteRouterForBot('nlu')
}

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  onBotUnmount,
  onModuleUnmount,
  definition: {
    name: 'nlu',
    moduleView: {
      stretched: true
    },
    menuIcon: 'fiber_smart_record',
    menuText: 'NLU',
    fullName: 'NLU',
    homepage: 'https://botpress.io'
  }
}

export default entryPoint

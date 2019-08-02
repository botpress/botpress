import 'bluebird-global'
import * as sdk from 'botpress/sdk'

import { Config } from '../config'

import api from './api'
import ConfusionEngine from './confusion-engine'
import LangProvider from './language-provider'
import { registerMiddleware } from './middleware'
import { DucklingEntityExtractor } from './pipelines/entities/duckling_extractor'
import Storage from './storage'
import { EngineByBot, LanguageProvider, NLUHealth } from './typings'

const nluByBot: EngineByBot = {}
let langProvider: LanguageProvider

export let nluHealth: NLUHealth

export const initializeLangServer = async (bp: typeof sdk) => {
  const globalConfig = (await bp.config.getModuleConfig('nlu')) as Config

  try {
    langProvider = await LangProvider.initialize(globalConfig.languageSources, bp.logger)
  } catch (e) {
    if (e.failure && e.failure.code === 'ECONNREFUSED') {
      bp.logger.error(`Language server can't be reached at adress ${e.failure.address}:${e.failure.port}`)
      process.exit()
    }
    throw e
  }

  const { validProvidersCount, validLanguages } = langProvider.getHealth()

  nluHealth = {
    isEnabled: validProvidersCount > 0 && validLanguages.length > 0,
    validProvidersCount,
    validLanguages
  } as NLUHealth
}

const onServerStarted = async (bp: typeof sdk) => {
  Storage.ghostProvider = (botId?: string) => (botId ? bp.ghost.forBot(botId) : bp.ghost.forGlobal())
  const globalConfig = (await bp.config.getModuleConfig('nlu')) as Config
  await DucklingEntityExtractor.configure(globalConfig.ducklingEnabled, globalConfig.ducklingURL, bp.logger)
  await initializeLangServer(bp)
  await registerMiddleware(bp, nluByBot)
}

const onServerReady = async (bp: typeof sdk) => {
  await api(bp, nluByBot)
}

const onBotMount = async (bp: typeof sdk, botId: string) => {
  const moduleBotConfig = (await bp.config.getModuleConfigForBot('nlu', botId)) as Config
  const bot = await bp.bots.getBotById(botId)

  const scoped = new ConfusionEngine(
    bp.logger,
    botId,
    moduleBotConfig,
    bp.MLToolkit,
    bot.languages,
    bot.defaultLanguage,
    langProvider,
    bp.realtime,
    bp.RealTimePayload
  )

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
    menuIcon: 'translate',
    menuText: 'NLU',
    fullName: 'NLU',
    homepage: 'https://botpress.io'
  }
}

export default entryPoint

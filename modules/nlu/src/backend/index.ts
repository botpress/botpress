import 'bluebird-global'
import * as sdk from 'botpress/sdk'

import { Config } from '../config'

import api from './api'
import ConfusionEngine from './confusion-engine'
import { registerMiddleware } from './middleware'
import { getPretrained as discoverLocalEmbeddings } from './models'
import { DucklingEntityExtractor } from './pipelines/entities/duckling_extractor'
import FTWordVecFeaturizer from './pipelines/language/ft_featurizer'
import Storage from './storage'
import { EngineByBot } from './typings'

const debug = DEBUG('nlu')
const debugEmbeddings = debug.sub('embeddings')

const nluByBot: EngineByBot = {}

const onServerStarted = async (bp: typeof sdk) => {
  Storage.ghostProvider = (botId?: string) => (botId ? bp.ghost.forBot(botId) : bp.ghost.forGlobal())

  const globalConfig = (await bp.config.getModuleConfig('nlu')) as Config

  await DucklingEntityExtractor.configure(globalConfig.ducklingEnabled, globalConfig.ducklingURL, bp.logger)

  FTWordVecFeaturizer.setToolkit(bp.MLToolkit)

  // TODO: Move this logic somewhere else
  const embeddings = discoverLocalEmbeddings()
  embeddings.forEach(e => {
    FTWordVecFeaturizer.provideLanguage(e.lang, e.path)
    debugEmbeddings('loaded local embedding', e)
  })

  await registerMiddleware(bp, nluByBot)
}

const onServerReady = async (bp: typeof sdk) => {
  await api(bp, nluByBot)
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

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  onBotMount,
  onBotUnmount,
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

import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import ms from 'ms'
import yn from 'yn'

import { Config } from '../config'

import api from './api'
import ConfusionEngine from './confusion-engine'
import Engine2, { E2ByBot, Tools, TrainInput } from './engine2/engine2'
import { computeModelHash, getModel, saveModel } from './engine2/model-service'
import LangProvider from './language-provider'
import { registerMiddleware } from './middleware'
import { DucklingEntityExtractor } from './pipelines/entities/duckling_extractor'
import Storage from './storage'
import { isPatternValid } from './tools/patterns-utils'
import { EngineByBot, LanguageProvider, NLUHealth } from './typings'

const USE_E1 = yn(process.env.USE_LEGACY_NLU)
const nluByBot: EngineByBot = {}
// TODO rethink this for an immutable bot state instead
const e2ByBot: E2ByBot = {}
const watchersByBot = {} as _.Dictionary<sdk.ListenHandle>

let langProvider: LanguageProvider
let distributedLoadModel: Function

export let nluHealth: NLUHealth

export const initializeLangServer = async (bp: typeof sdk) => {
  const globalConfig = (await bp.config.getModuleConfig('nlu')) as Config

  try {
    langProvider = await LangProvider.initialize(globalConfig.languageSources, bp.logger)
  } catch (e) {
    if (e.failure && e.failure.code === 'ECONNREFUSED') {
      bp.logger.error(`Language server can't be reached at adress ${e.failure.address}:${e.failure.port}`)
      if (!process.IS_FAILSAFE) {
        process.exit()
      }
    }
    throw e
  }

  const { validProvidersCount, validLanguages } = langProvider.getHealth()

  // check if we can remove this
  nluHealth = {
    isEnabled: validProvidersCount > 0 && validLanguages.length > 0,
    validProvidersCount,
    validLanguages
  } as NLUHealth
}

function initializeEngine2(bp: typeof sdk) {
  const tools: Tools = {
    tokenize_utterances: (utterances, lang) => langProvider.tokenize(utterances, lang),
    vectorize_tokens: async (tokens, lang) => {
      const a = await langProvider.vectorize(tokens, lang)
      return a.map(x => Array.from(x.values()))
    },
    generateSimilarJunkWords: (vocab: string[], lang: string) => langProvider.generateSimilarJunkWords(vocab, lang),
    mlToolkit: bp.MLToolkit,
    ducklingExtractor: new DucklingEntityExtractor(bp.logger)
  }
  Engine2.provideTools(tools)
}

async function initDucklingExtractor(bp: typeof sdk): Promise<void> {
  const globalConfig = (await bp.config.getModuleConfig('nlu')) as Config
  await DucklingEntityExtractor.configure(globalConfig.ducklingEnabled, globalConfig.ducklingURL, bp.logger)
}

const onServerStarted = async (bp: typeof sdk) => {
  Storage.ghostProvider = (botId?: string) => (botId ? bp.ghost.forBot(botId) : bp.ghost.forGlobal())
  await initDucklingExtractor(bp)
  await initializeLangServer(bp)
  initializeEngine2(bp)
  await registerMiddleware(bp, nluByBot, e2ByBot)
}

const onServerReady = async (bp: typeof sdk) => {
  const loadModel = async (botId: string, hash: string, language: string) => {
    const ghost = bp.ghost.forBot(botId)
    const model = await getModel(ghost, hash, language)
    if (model) {
      await e2ByBot[botId].loadModel(model)
    }
  }

  distributedLoadModel = await bp.distributed.broadcast(loadModel)
  await api(bp, nluByBot)
}

const onBotMount = async (bp: typeof sdk, botId: string) => {
  const moduleBotConfig = (await bp.config.getModuleConfigForBot('nlu', botId)) as Config
  const bot = await bp.bots.getBotById(botId)

  const languages = _.intersection(bot.languages, langProvider.languages)
  if (bot.languages.length !== languages.length) {
    const diff = _.difference(bot.languages, languages)
    bp.logger.warn(
      `Bot ${
        bot.id
      } has configured languages that are not supported by language sources. Configure a before incoming hook to call an external NLU provider for those languages.`,
      { notSupported: diff }
    )
  }

  const scoped = new ConfusionEngine(
    bp.logger,
    botId,
    moduleBotConfig,
    bp.MLToolkit,
    languages,
    bot.defaultLanguage,
    langProvider,
    bp.realtime,
    bp.RealTimePayload
  )

  nluByBot[botId] = scoped
  if (USE_E1) {
    await scoped.init()
    return
  }

  const e2 = new Engine2(bot.defaultLanguage, bp.logger.forBot(botId))
  const ghost = bp.ghost.forBot(botId)

  const trainOrLoad = _.debounce(
    async () => {
      const intents = await scoped.storage.getIntents() // todo replace this with intent service when implemented
      const entities = await scoped.storage.getCustomEntities() // TODO: replace this wit entities service once implemented
      const hash = computeModelHash(intents, entities)
      // we could just feed intents and entities to E2.train() ==> and make .train implement the mapping logic
      const list_entities = entities
        .filter(ent => ent.type === 'list')
        .map(e => {
          return {
            name: e.name,
            fuzzyMatching: e.fuzzy,
            sensitive: e.sensitive,
            synonyms: _.chain(e.occurences)
              .keyBy('name')
              .mapValues('synonyms')
              .value()
          }
        })

      const pattern_entities = entities
        .filter(ent => ent.type === 'pattern' && isPatternValid(ent.pattern))
        .map(ent => ({
          name: ent.name,
          pattern: ent.pattern,
          examples: [], // TODO add this to entityDef
          ignoreCase: true, // TODO add this entityDef
          sensitive: ent.sensitive
        }))

      const contexts = _.chain(intents)
        .flatMap(i => i.contexts)
        .uniq()
        .value()

      await Promise.mapSeries(languages, async languageCode => {
        const lock = await bp.distributed.acquireLock(`train:${botId}:${languageCode}`, ms('3m'))
        if (!lock) {
          return
        }
        let model = await getModel(ghost, hash, languageCode)
        if (!model) {
          const input: TrainInput = {
            languageCode,
            list_entities,
            pattern_entities,
            contexts,
            intents: intents
              .filter(x => !!x.utterances[languageCode])
              .map(x => ({
                name: x.name,
                contexts: x.contexts,
                utterances: x.utterances[languageCode],
                slot_definitions: x.slots
              }))
          }
          model = await e2.train(input)
          if (model.success) {
            await saveModel(ghost, model, hash)
          }
        }
        await lock.unlock()
        if (model.success) {
          await distributedLoadModel(botId, hash, languageCode)
        }
      })
    },
    4000,
    { leading: true }
  )

  e2ByBot[botId] = e2
  watchersByBot[botId] = bp.ghost.forBot(botId).onFileChanged(async f => {
    if (f.includes('intents') || f.includes('entities')) {
      await trainOrLoad() // train or reload old model
    }
  })

  trainOrLoad() // floating promise on purpose
}

const onBotUnmount = async (bp: typeof sdk, botId: string) => {
  delete nluByBot[botId]
  if (USE_E1) {
    return
  }

  delete e2ByBot[botId]
  watchersByBot[botId].remove()
  delete watchersByBot[botId]
}

const onModuleUnmount = async (bp: typeof sdk) => {
  bp.events.removeMiddleware('nlu.incoming')
  bp.http.deleteRouterForBot('nlu')
  // if module gets deactivated but server keeps running, we want to destroy bot state
  if (!USE_E1) {
    Object.keys(e2ByBot).forEach(botID => () => onBotUnmount(bp, botID))
  }
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

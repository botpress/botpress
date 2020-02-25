import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import ms from 'ms'
import yn from 'yn'

import { Config } from '../../config'
import ConfusionEngine from '../confusion-engine'
import ScopedEngine from '../engine'
import Engine2 from '../engine2/engine2'
import * as ModelService from '../engine2/model-service'
import { makeTrainingSession, makeTrainSessionKey } from '../engine2/train-session-service'
import { NLUState } from '../typings'

const USE_E1 = yn(process.env.USE_LEGACY_NLU)

const missingLangMsg = botId =>
  `Bot ${botId} has configured languages that are not supported by language sources. Configure a before incoming hook to call an external NLU provider for those languages.`

export function getOnBotMount(state: NLUState) {
  return async (bp: typeof sdk, botId: string) => {
    const moduleBotConfig = (await bp.config.getModuleConfigForBot('nlu', botId)) as Config
    const bot = await bp.bots.getBotById(botId)

    const languages = _.intersection(bot.languages, state.languageProvider.languages)
    if (bot.languages.length !== languages.length) {
      bp.logger.warn(missingLangMsg(botId), { notSupported: _.difference(bot.languages, languages) })
    }

    const engine1 = new ConfusionEngine(
      bp.logger,
      botId,
      moduleBotConfig,
      bp.MLToolkit,
      languages,
      bot.defaultLanguage,
      state.languageProvider,
      bp.realtime,
      bp.RealTimePayload
    )

    if (USE_E1) {
      await engine1.init()
      // @ts-ignore
      state.nluByBot[botId] = { engine1 }
      return
    }

    const engine = new Engine2(bot.defaultLanguage, bot.id)
    const trainOrLoad = _.debounce(
      async (forceTrain: boolean = false) => {
        const ghost = bp.ghost.forBot(botId)
        const intentDefs = await (engine1 as ScopedEngine).storage.getIntents() // TODO replace this with intent service when implemented
        const entityDefs = await (engine1 as ScopedEngine).storage.getCustomEntities() // TODO: replace this with entities service once implemented
        const hash = ModelService.computeModelHash(intentDefs, entityDefs)

        await Promise.mapSeries(languages, async languageCode => {
          // shorter lock and extend in training steps
          const lock = await bp.distributed.acquireLock(makeTrainSessionKey(botId, languageCode), ms('5m'))
          if (!lock) {
            return
          }
          let model = await ModelService.getModel(ghost, hash, languageCode)
          if (forceTrain || !model) {
            const trainSession = makeTrainingSession(languageCode, lock)
            state.nluByBot[botId].trainSessions[languageCode] = trainSession

            model = await engine.train(intentDefs, entityDefs, languageCode, trainSession)
            if (model.success) {
              await ModelService.saveModel(ghost, model, hash)
            }
          }
          try {
            if (model.success) {
              await state.broadcastLoadModel(botId, hash, languageCode)
            }
          } finally {
            await lock.unlock()
          }
          // TODO remove training session from state, kvs will clear itself or not ?
        })
      },
      4000,
      { leading: true }
    )
    // register trainOrLoad with ghost file watcher
    // we use local events so training occurs on the same node where the request for changes enters
    const trainWatcher = bp.ghost.forBot(botId).onFileChanged(async f => {
      if (f.includes('intents') || f.includes('entities')) {
        // eventually cancel & restart training only for given language
        await Promise.map(languages, async lang => {
          const key = makeTrainSessionKey(botId, lang)
          await bp.distributed.clearLock(key)
          return state.broadcastCancelTraining(botId, lang)
        })
        trainOrLoad()
      }
    })

    state.nluByBot[botId] = {
      botId,
      engine,
      engine1,
      trainWatcher,
      trainOrLoad,
      trainSessions: {}
    }

    trainOrLoad(yn(process.env.FORCE_TRAIN_ON_MOUNT)) // floating promise on purpose
  }
}

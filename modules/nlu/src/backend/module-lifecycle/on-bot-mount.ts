import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import ms from 'ms'
import yn from 'yn'

import Engine from '../engine'
import { getCustomEntities } from '../entities/entities-service'
import { getIntents } from '../intents/intent-service'
import * as ModelService from '../model-service'
import { makeTrainingSession, makeTrainSessionKey } from '../train-session-service'
import { NLUState } from '../typings'

const missingLangMsg = botId =>
  `Bot ${botId} has configured languages that are not supported by language sources. Configure a before incoming hook to call an external NLU provider for those languages.`

export function getOnBotMount(state: NLUState) {
  return async (bp: typeof sdk, botId: string) => {
    const bot = await bp.bots.getBotById(botId)
    const ghost = bp.ghost.forBot(botId)

    const languages = _.intersection(bot.languages, state.languageProvider.languages)
    if (bot.languages.length !== languages.length) {
      bp.logger.warn(missingLangMsg(botId), { notSupported: _.difference(bot.languages, languages) })
    }

    const engine = new Engine(bot.defaultLanguage, bot.id)
    const trainOrLoad = _.debounce(
      async (forceTrain: boolean = false) => {
        // bot got deleted
        if (!state.nluByBot[botId]) {
          return
        }

        const intentDefs = await getIntents(ghost)
        const entityDefs = await getCustomEntities(ghost)
        const hash = ModelService.computeModelHash(intentDefs, entityDefs)

        await Promise.mapSeries(languages, async languageCode => {
          // shorter lock and extend in training steps
          const lock = await bp.distributed.acquireLock(makeTrainSessionKey(botId, languageCode), ms('5m'))
          if (!lock) {
            return
          }
          await ModelService.pruneModels(ghost, languageCode)
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
        })
      },
      10000,
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
      trainWatcher,
      trainOrLoad,
      trainSessions: {}
    }

    trainOrLoad(yn(process.env.FORCE_TRAIN_ON_MOUNT)) // floating promise on purpose
  }
}

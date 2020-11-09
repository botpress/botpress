import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import ms from 'ms'

import { createApi } from '../../api'
import * as ModelService from '../model-service'
import {
  getTrainingSession,
  makeTrainingSession,
  makeTrainSessionKey,
  setTrainingSession
} from '../train-session-service'
import { NLUState } from '../typings'

const missingLangMsg = botId =>
  `Bot ${botId} has configured languages that are not supported by language sources. Configure a before incoming hook to call an external NLU provider for those languages.`

const KVS_TRAINING_STATUS_KEY = 'nlu:trainingStatus'

async function annouceNeedsTraining(bp: typeof sdk, botId: string, engine: sdk.NLU.Engine, state: NLUState) {
  const api = await createApi(bp, botId)
  const intentDefs = await api.fetchIntentsWithQNAs()
  const entityDefs = await api.fetchEntities()

  const botLanguages = (await bp.bots.getBotById(botId)).languages
  const trainSessions = await Promise.map(botLanguages, (lang: string) => getTrainingSession(bp, botId, lang))

  const languageWithChanges = botLanguages.filter(lang => {
    const ts = trainSessions.find(t => t.language === lang)
    if (ts?.status === 'training') {
      return false // do not send a needs-training event if currently training
    }
    const hash = engine.computeModelHash(intentDefs, entityDefs, lang)
    return !engine.hasModel(hash)
  })

  await Promise.map(languageWithChanges, async lang => {
    const trainSession = await getTrainingSession(bp, botId, lang)
    trainSession.status = 'needs-training'
    return Promise.all([setTrainingSession(bp, botId, trainSession), state.sendNLUStatusEvent(botId, trainSession)])
  })
}

function registerNeedTrainingWatcher(bp: typeof sdk, botId: string, engine: sdk.NLU.Engine, state: NLUState) {
  function hasPotentialNLUChange(filePath: string): boolean {
    return filePath.includes('/intents/') || filePath.includes('/entities/')
  }

  return bp.ghost.forBot(botId).onFileChanged(filePath => {
    if (hasPotentialNLUChange(filePath)) {
      return annouceNeedsTraining(bp, botId, engine, state)
    }
  })
}

export function getOnBotMount(state: NLUState) {
  return async (bp: typeof sdk, botId: string) => {
    const bot = await bp.bots.getBotById(botId)
    const ghost = bp.ghost.forBot(botId)

    const languages = _.intersection(bot.languages, state.engine.getLanguages())
    if (bot.languages.length !== languages.length) {
      bp.logger.forBot(botId).warn(missingLangMsg(botId), { notSupported: _.difference(bot.languages, languages) })
    }

    const { engine } = state
    const trainOrLoad = async (disableTraining: boolean) => {
      // bot got deleted
      const botState = state.nluByBot[botId]
      if (!botState) {
        return
      }

      const api = await createApi(bp, botId)
      const intentDefs = await api.fetchIntentsWithQNAs()
      const entityDefs = await api.fetchEntities()

      const kvs = bp.kvs.forBot(botId)
      await kvs.set(KVS_TRAINING_STATUS_KEY, 'training')

      try {
        await Promise.mapSeries(languages, async languageCode => {
          // shorter lock and extend in training steps
          const lock = await bp.distributed.acquireLock(makeTrainSessionKey(botId, languageCode), ms('5m'))
          if (!lock) {
            return
          }

          const hash = engine.computeModelHash(intentDefs, entityDefs, languageCode)
          await ModelService.pruneModels(ghost, languageCode)
          let model = await ModelService.getModel(ghost, hash, languageCode)

          const trainSession = makeTrainingSession(botId, languageCode, lock)

          botState.trainSessions[languageCode] = trainSession
          if (!model && !disableTraining) {
            await state.sendNLUStatusEvent(botId, trainSession)

            const progressCallback = async (progress: number) => {
              trainSession.status = 'training'
              trainSession.progress = progress
              await state.sendNLUStatusEvent(botId, trainSession)
            }

            const rand = () => Math.round(Math.random() * 10000)
            const nluSeed = parseInt(process.env.NLU_SEED) || rand()

            const previousModel = botState.modelsByLang[languageCode]
            const options: sdk.NLU.TrainingOptions = { previousModel, nluSeed, progressCallback }
            try {
              model = await engine.train(trainSession.key, intentDefs, entityDefs, languageCode, options)

              trainSession.status = 'done'
              await state.sendNLUStatusEvent(botId, trainSession)
              botState.modelsByLang[languageCode] = model.hash
              await engine.loadModel(model, model.hash)
              await ModelService.saveModel(ghost, model, hash)
            } catch (err) {
              if (bp.NLU.errors.isTrainingCanceled(err)) {
                bp.logger.forBot(botId).info('Training cancelled')
                trainSession.status = 'needs-training'
                await state.sendNLUStatusEvent(botId, trainSession)
              } else if (bp.NLU.errors.isTrainingAlreadyStarted(err)) {
                bp.logger.forBot(botId).info('Training already started')
              } else {
                bp.logger
                  .forBot(botId)
                  .attachError(err)
                  .error('Training could not finish because of an unexpected error.')
                trainSession.status = 'needs-training'
                await state.sendNLUStatusEvent(botId, trainSession)
              }
            }
          } else {
            trainSession.progress = 1
            trainSession.status = 'done'
            await state.sendNLUStatusEvent(botId, trainSession)
          }
          try {
            if (model) {
              await state.broadcastLoadModel(botId, hash, languageCode)
            }
          } finally {
            await lock.unlock()
          }
        })
      } finally {
        await kvs.delete(KVS_TRAINING_STATUS_KEY)
      }
    }

    const cancelTraining = async () => {
      await Promise.map(languages, async lang => {
        const key = makeTrainSessionKey(botId, lang)
        await bp.distributed.clearLock(key)
        return state.broadcastCancelTraining(botId, lang)
      })
    }

    const needsTrainingWatcher = registerNeedTrainingWatcher(bp, botId, engine, state)

    const { defaultLanguage } = bot
    state.nluByBot[botId] = {
      botId,
      defaultLanguage,
      trainOrLoad,
      trainSessions: {},
      cancelTraining,
      needsTrainingWatcher,
      modelsByLang: {}
    }

    const disableTraining = true
    await trainOrLoad(disableTraining)
    await annouceNeedsTraining(bp, bot.id, engine, state)
  }
}

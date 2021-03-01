import * as NLU from 'botpress/nlu'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import ms from 'ms'

import { createApi } from '../../api'
import ModelService from '../model-service'
import { getSeed } from '../seed-service'
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

async function annouceNeedsTraining(bp: typeof sdk, botId: string, state: NLUState) {
  const { engine } = state
  const { modelIdService } = bp.NLU.core

  const api = await createApi(bp, botId)
  const intentDefs = await api.fetchIntentsWithQNAs()
  const entityDefs = await api.fetchEntities()

  const bot = await bp.bots.getBotById(botId)
  const { languages: botLanguages } = bot
  const seed = getSeed(bot)
  const trainSessions = await Promise.map(botLanguages, (lang: string) => getTrainingSession(bp, botId, lang))

  const languageWithChanges = botLanguages.filter(lang => {
    const ts = trainSessions.find(t => t.language === lang)
    if (ts?.status === 'training') {
      return false // do not send a needs-training event if currently training
    }

    const specifications = engine.getSpecifications()
    const modelId = modelIdService.makeId({ specifications, intentDefs, entityDefs, languageCode: lang, seed })
    return !engine.hasModel(modelId)
  })

  await Promise.map(languageWithChanges, async lang => {
    const trainSession = await getTrainingSession(bp, botId, lang)
    trainSession.status = 'needs-training'
    return Promise.all([setTrainingSession(bp, botId, trainSession), state.sendNLUStatusEvent(botId, trainSession)])
  })
}

function registerNeedTrainingWatcher(bp: typeof sdk, botId: string, engine: NLU.Engine, state: NLUState) {
  function hasPotentialNLUChange(filePath: string): boolean {
    return filePath.includes('/intents/') || filePath.includes('/entities/')
  }

  return bp.ghost.forBot(botId).onFileChanged(filePath => {
    if (hasPotentialNLUChange(filePath)) {
      return annouceNeedsTraining(bp, botId, state)
    }
  })
}

export function getOnBotMount(state: NLUState) {
  return async (bp: typeof sdk, botId: string) => {
    const bot = await bp.bots.getBotById(botId)
    const ghost = bp.ghost.forBot(botId)

    const { modelIdService } = bp.NLU.core
    const modelService = new ModelService(modelIdService, ghost, botId)
    await modelService.initialize()

    const { engine } = state
    const trainOrLoad = async (languageCode: string, disableTraining: boolean) => {
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
        // shorter lock and extend in training steps
        const lock = await bp.distributed.acquireLock(makeTrainSessionKey(botId, languageCode), ms('5m'))
        if (!lock) {
          return
        }

        const trainSet: NLU.TrainingSet = {
          intentDefs,
          entityDefs,
          languageCode,
          seed: getSeed(bot)
        }

        const specifications = engine.getSpecifications()
        const modelId = modelIdService.makeId({
          ...trainSet,
          specifications
        })

        const modelsOfLang = await modelService.listModels({ languageCode })
        await modelService.pruneModels(modelsOfLang, { toKeep: 2 })

        let model = await modelService.getModel(modelId)

        const trainSession = makeTrainingSession(botId, languageCode, lock)

        botState.trainSessions[languageCode] = trainSession
        if (!model && !disableTraining) {
          await state.sendNLUStatusEvent(botId, trainSession)

          const progressCallback = async (progress: number) => {
            trainSession.status = 'training'
            trainSession.progress = progress
            await state.sendNLUStatusEvent(botId, trainSession)
          }

          const previousModel = botState.modelsByLang[languageCode]
          const options: NLU.TrainingOptions = { previousModel, progressCallback }
          try {
            model = await engine.train(trainSession.key, trainSet, options)

            trainSession.status = 'done'
            await state.sendNLUStatusEvent(botId, trainSession)
            botState.modelsByLang[languageCode] = modelId
            await engine.loadModel(model)
            await modelService.saveModel(model)
          } catch (err) {
            if (bp.NLU.core.errors.isTrainingCanceled(err)) {
              bp.logger.forBot(botId).info('Training cancelled')
              trainSession.status = 'needs-training'
              await state.sendNLUStatusEvent(botId, trainSession)
            } else if (bp.NLU.core.errors.isTrainingAlreadyStarted(err)) {
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
            const modelId = modelIdService.toId(model)
            await state.broadcastLoadModel(botId, modelId)
          }
        } finally {
          await lock.unlock()
        }
      } finally {
        await kvs.delete(KVS_TRAINING_STATUS_KEY)
      }
    }

    const cancelTraining = async (lang: string) => {
      const key = makeTrainSessionKey(botId, lang)
      await bp.distributed.clearLock(key)
      return state.broadcastCancelTraining(botId, lang)
    }

    const needsTrainingWatcher = registerNeedTrainingWatcher(bp, botId, engine, state)

    const { defaultLanguage } = bot
    const languages = _.intersection(bot.languages, state.engine.getLanguages())
    if (bot.languages.length !== languages.length) {
      bp.logger.forBot(botId).warn(missingLangMsg(botId), { notSupported: _.difference(bot.languages, languages) })
    }

    state.nluByBot[botId] = {
      botId,
      defaultLanguage,
      languages,
      trainOrLoad,
      trainSessions: {},
      cancelTraining,
      needsTrainingWatcher,
      modelsByLang: {},
      modelService
    }

    const disableTraining = true
    await Promise.mapSeries(languages, lang => trainOrLoad(lang, disableTraining))
    await annouceNeedsTraining(bp, bot.id, state)
  }
}

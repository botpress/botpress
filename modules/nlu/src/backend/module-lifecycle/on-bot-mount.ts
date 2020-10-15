import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import ms from 'ms'
import yn from 'yn'

import { LegacyIntentService } from '../intents/legacy-intent-service'
import { makeLoggerWrapper } from '../logger'
import * as ModelService from '../model-service'
import { NLUService } from '../nlu-service'
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

function registerNeedTrainingWatcher(bp: typeof sdk, botId: string, engine, nluService, state: NLUState) {
  function hasPotentialNLUChange(filePath: string): boolean {
    return (
      filePath.endsWith('.intents.json') ||
      filePath.endsWith('.flow.json') ||
      filePath.includes('/intents/') || // legacy
      filePath.includes('/entities/')
    )
  }

  return bp.ghost.forBot(botId).onFileChanged(async filePath => {
    if (hasPotentialNLUChange(filePath)) {
      const { intentDefs, entityDefs } = await nluService.getIntentsAndEntities()
      const languageWithChanges = (await bp.bots.getBotById(botId)).languages.filter(lang => {
        const hash = engine.computeModelHash(intentDefs, entityDefs, lang)
        return !engine.hasModel(lang, hash)
      })
      await Promise.map(languageWithChanges, async lang => {
        const trainSession = await getTrainingSession(bp, botId, lang)
        trainSession.status = 'needs-training'
        return Promise.all([setTrainingSession(bp, botId, trainSession), state.sendNLUStatusEvent(botId, trainSession)])
      })
    }
  })
}

export function getOnBotMount(state: NLUState) {
  return async (bp: typeof sdk, botId: string) => {
    const bot = await bp.bots.getBotById(botId)
    const ghost = bp.ghost.forBot(botId)

    const languages = _.intersection(bot.languages, bp.NLU.Engine.getLanguages())
    if (bot.languages.length !== languages.length) {
      bp.logger.warn(missingLangMsg(botId), { notSupported: _.difference(bot.languages, languages) })
    }

    const logger = makeLoggerWrapper(bp, botId)
    const engine = new bp.NLU.Engine(bot.id, logger)

    const legacyIntentService = new LegacyIntentService(bp, bot.id)
    const nluService = new NLUService(bp, bot, legacyIntentService, logger)

    const trainOrLoad = _.debounce(
      async (forceTrain: boolean = false) => {
        // bot got deleted
        if (!state.nluByBot[botId]) {
          return
        }

        const { intentDefs, entityDefs } = await nluService.getIntentsAndEntities()

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
            state.nluByBot[botId].trainSessions[languageCode] = trainSession
            if ((forceTrain || !model) && !yn(process.env.BP_NLU_DISABLE_TRAINING)) {
              await setTrainingSession(bp, botId, trainSession)

              const progressCallback = async (progress: number) => {
                trainSession.progress = progress
                await state.sendNLUStatusEvent(botId, trainSession)
              }

              const rand = () => Math.round(Math.random() * 10000)
              const nluSeed = parseInt(process.env.NLU_SEED) || rand()

              const options: sdk.NLU.TrainingOptions = { forceTrain, nluSeed, progressCallback }
              model = await engine.train(trainSession.key, intentDefs, entityDefs, languageCode, options)
              if (model) {
                trainSession.status = 'done'
                await state.sendNLUStatusEvent(botId, trainSession)
                await engine.loadModel(model)
                await ModelService.saveModel(ghost, model, hash)
              } else {
                trainSession.status = 'needs-training'
                await state.sendNLUStatusEvent(botId, trainSession)
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
      },
      10000,
      { leading: true }
    )

    const cancelTraining = async () => {
      await Promise.map(languages, async lang => {
        const key = makeTrainSessionKey(botId, lang)
        await bp.distributed.clearLock(key)
        return state.broadcastCancelTraining(botId, lang)
      })
    }

    const needsTrainingWatcher = registerNeedTrainingWatcher(bp, botId, engine, nluService, state)

    const { defaultLanguage } = bot
    state.nluByBot[botId] = {
      botId,
      engine,
      defaultLanguage,
      trainOrLoad,
      trainSessions: {},
      cancelTraining,
      nluService,
      legacyIntentService,
      needsTrainingWatcher
    }

    // No need to wait for training as its a long and async process
    // tslint:disable-next-line: no-floating-promises
    trainOrLoad(yn(process.env.FORCE_TRAIN_ON_MOUNT))
  }
}

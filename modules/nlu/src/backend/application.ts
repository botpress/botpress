import * as sdk from 'botpress/sdk'
import { NLU } from 'botpress/sdk'
import _ from 'lodash'
import ms from 'ms'

import { createApi, NLUApi as NLURepository } from '../api'

import { BotDoesntSpeakLanguageError, BotNotMountedError } from './errors'
import ScopedModelService from './model-service'
import { ScopedPredictionHandler } from './prediction-handler'
import { getSeed } from './seed-service'
import TrainSessionService from './train-session-service'

const KVS_TRAINING_STATUS_KEY = 'nlu:trainingStatus'

export interface BotState {
  config: sdk.BotConfig
  defaultLanguage: string
  languages: string[]
  modelsByLang: _.Dictionary<NLU.ModelId>

  // TODO: we keep this DS in memory because it contains an unserializable lock,
  // but this should be abstracted by the train session service.
  trainSessions: _.Dictionary<NLU.TrainingSession>
}

export interface ScopedServices {
  modelService: ScopedModelService
  predictor: ScopedPredictionHandler
  needsTrainingWatcher: sdk.ListenHandle
}

export type TrainSocket = (botId: string, trainSession: NLU.TrainingSession) => Promise<void>

export class NLUApplication {
  private _bots: _.Dictionary<BotState & ScopedServices> = {}

  constructor(
    private _bp: typeof sdk | undefined,
    private _engine: NLU.Engine,
    private _trainSessionService: TrainSessionService,
    private _sendSocket: TrainSocket
  ) {}

  public teardown = async () => {
    for (const botId of Object.keys(this._bots)) {
      await this.unmountBot(botId)
    }
  }

  public hasBot = (botId: string) => {
    return !!this._bots[botId]
  }

  public mountBot = async (botId: string) => {
    const { _bp, _engine } = this
    const bot = await _bp.bots.getBotById(botId)

    const needsTrainingWatcher = this._registerNeedTrainingWatcher(botId)

    const { defaultLanguage } = bot
    const languages = _.intersection(bot.languages, _engine.getLanguages())
    if (bot.languages.length !== languages.length) {
      const missingLangMsg = `Bot ${botId} has configured languages that are not supported by language sources. Configure a before incoming hook to call an external NLU provider for those languages.`
      _bp.logger.forBot(botId).warn(missingLangMsg, { notSupported: _.difference(bot.languages, languages) })
    }

    const state: BotState = {
      config: bot,
      defaultLanguage,
      languages,
      modelsByLang: {},
      trainSessions: {}
    }

    const modelService = new ScopedModelService(_bp, botId)
    await modelService.initialize()

    const predictor = new ScopedPredictionHandler(
      _engine,
      modelService,
      _bp.NLU.modelIdService,
      _bp.logger.forBot(botId),
      state
    )

    // TODO: Scoped services should be resolved by a factory function passed at ctor
    const scopedServices: ScopedServices = {
      modelService,
      predictor,
      needsTrainingWatcher
    }

    this._bots[botId] = {
      ...state,
      ...scopedServices
    }

    const disableTraining = true
    await Promise.mapSeries(languages, lang => this.trainOrLoad(botId, lang, disableTraining))
    await this._annouceNeedsTraining(botId)
  }

  private _registerNeedTrainingWatcher = (botId: string) => {
    function hasPotentialNLUChange(filePath: string): boolean {
      return filePath.includes('/intents/') || filePath.includes('/entities/')
    }

    return this._bp.ghost.forBot(botId).onFileChanged(filePath => {
      if (hasPotentialNLUChange(filePath)) {
        return this._annouceNeedsTraining(botId)
      }
    })
  }

  private _annouceNeedsTraining = async (botId: string) => {
    const { _engine, _trainSessionService, _bp, _sendSocket: _sendStatusEvent, _bots } = this
    const { modelIdService } = _bp.NLU
    const nluRepository = await createApi(_bp, botId)

    const intentDefs = await nluRepository.fetchIntentsWithQNAs()
    const entityDefs = await nluRepository.fetchEntities()

    const bot = await _bp.bots.getBotById(botId)
    const { languages: botLanguages } = bot
    const seed = getSeed(bot)
    const trainSessions = await Promise.map(botLanguages, (lang: string) =>
      _trainSessionService.getTrainingSession(botId, lang)
    )

    const languageWithChanges = botLanguages.filter(lang => {
      const ts = trainSessions.find(t => t.language === lang)
      if (ts?.status === 'training') {
        return false // do not send a needs-training event if currently training
      }

      const specifications = _engine.getSpecifications()
      const modelId = modelIdService.makeId({ specifications, intentDefs, entityDefs, languageCode: lang, seed })
      return !_engine.hasModel(modelId)
    })

    await Promise.map(languageWithChanges, async lang => {
      const trainSession = await _trainSessionService.getTrainingSession(botId, lang)
      trainSession.status = 'needs-training'
      return Promise.all([
        _trainSessionService.setTrainingSession(botId, trainSession),
        _sendStatusEvent(botId, trainSession)
      ])
    })
  }

  public unmountBot = async (botId: string) => {
    const botState = this._bots[botId]
    if (!botState) {
      return
    }

    const activeTrainSession = Object.values(botState.trainSessions ?? {}).filter(
      trainSession => trainSession.status === 'training'
    )

    await Promise.map(activeTrainSession, async ts => {
      await this.broadcastCancelTraining(botId, ts.language)
      await this._trainSessionService.removeTrainingSession(botId, ts)
    })

    botState.needsTrainingWatcher.remove()

    for (const model of Object.values(botState.modelsByLang)) {
      this._engine.unloadModel(model)
    }

    delete this._bots[botId]
  }

  private _broadcastLoadModel = async (botId: string, modelId: NLU.ModelId): Promise<void> => {
    const loadModel = this._loadModel
    const broadcastLoadModel = (await this._bp.distributed.broadcast(loadModel)) as typeof loadModel
    return broadcastLoadModel(botId, modelId)
  }

  private _loadModel = async (botId: string, modelId: NLU.ModelId) => {
    const bot = this._bots[botId]
    if (!bot) {
      return
    }

    const model = await bot.modelService.getModel(modelId)
    if (model) {
      bot.modelsByLang[model.languageCode] = modelId
      await this._engine.loadModel(model)
    }
  }

  public trainOrLoad = async (botId: string, language: string, disableTraining: boolean): Promise<void> => {
    const { _bots, _bp, _trainSessionService, _engine } = this

    const bot = _bots[botId]
    if (!bot) {
      throw new BotNotMountedError(botId)
    }

    if (!bot.languages.includes(language)) {
      throw new BotDoesntSpeakLanguageError(botId, language)
    }

    const { config, modelService } = bot

    const nluRepository = await createApi(_bp, botId)
    const intentDefs = await nluRepository.fetchIntentsWithQNAs()
    const entityDefs = await nluRepository.fetchEntities()

    const kvs = _bp.kvs.forBot(botId)
    await kvs.set(KVS_TRAINING_STATUS_KEY, 'training')

    try {
      // shorter lock and extend in training steps
      const lock = await _bp.distributed.acquireLock(
        _trainSessionService.makeTrainSessionKey(botId, language),
        ms('5m')
      )
      if (!lock) {
        return
      }

      const trainSet: sdk.NLU.TrainingSet = {
        intentDefs,
        entityDefs,
        languageCode: language,
        seed: getSeed(config)
      }

      const specifications = _engine.getSpecifications()
      const modelId = _bp.NLU.modelIdService.makeId({
        ...trainSet,
        specifications
      })

      const modelsOfLang = await modelService.listModels({ languageCode: language })
      await modelService.pruneModels(modelsOfLang, { toKeep: 2 })

      let model = await modelService.getModel(modelId)

      const trainSession = _trainSessionService.makeTrainingSession(botId, language, lock)

      bot.trainSessions[language] = trainSession
      if (!model && !disableTraining) {
        await this._sendSocket(botId, trainSession)

        const progressCallback = async (progress: number) => {
          trainSession.status = 'training'
          trainSession.progress = progress
          await this._sendSocket(botId, trainSession)
        }

        const previousModel = bot.modelsByLang[language]
        const options: sdk.NLU.TrainingOptions = { previousModel, progressCallback }
        try {
          model = await _engine.train(trainSession.key, trainSet, options)

          trainSession.status = 'done'
          await this._sendSocket(botId, trainSession)
          bot.modelsByLang[language] = modelId
          await _engine.loadModel(model)
          await modelService.saveModel(model)
        } catch (err) {
          if (_bp.NLU.errors.isTrainingCanceled(err)) {
            _bp.logger.forBot(botId).info('Training cancelled')
            trainSession.status = 'needs-training'
            await this._sendSocket(botId, trainSession)
          } else if (_bp.NLU.errors.isTrainingAlreadyStarted(err)) {
            _bp.logger.forBot(botId).info('Training already started')
          } else {
            _bp.logger
              .forBot(botId)
              .attachError(err)
              .error('Training could not finish because of an unexpected error.')
            trainSession.status = 'needs-training'
            await this._sendSocket(botId, trainSession)
          }
        }
      } else {
        trainSession.progress = 1
        trainSession.status = 'done'
        await this._sendSocket(botId, trainSession)
      }
      try {
        if (model) {
          const modelId = _bp.NLU.modelIdService.toId(model)
          await this._broadcastLoadModel(botId, modelId)
        }
      } finally {
        await lock.unlock()
      }
    } finally {
      await kvs.delete(KVS_TRAINING_STATUS_KEY)
    }
  }

  public predict = async (botId: string, textInput: string, anticipatedLanguage?: string) => {
    const bot = this._bots[botId]
    if (!bot) {
      throw new BotNotMountedError(botId)
    }

    const { predictor, defaultLanguage } = this._bots[botId]
    return predictor.predict(textInput, anticipatedLanguage ?? defaultLanguage)
  }

  public broadcastCancelTraining = async (botId: string, language: string): Promise<void> => {
    const bot = this._bots[botId]
    if (!bot) {
      throw new BotNotMountedError(botId)
    }
    if (!bot.languages.includes(language)) {
      throw new BotDoesntSpeakLanguageError(botId, language)
    }

    const cancelTraining = this._cancelTraining
    const broadcastCancelTraining = (await this._bp.distributed.broadcast(cancelTraining)) as typeof cancelTraining
    return broadcastCancelTraining(botId, language)
  }

  private _cancelTraining = async (botId: string, language: string) => {
    const bot = this._bots[botId]
    if (!bot) {
      return
    }

    const trainSession: sdk.NLU.TrainingSession = bot.trainSessions[language]
    if (trainSession && trainSession.status === 'training') {
      if (trainSession.lock) {
        await trainSession.lock.unlock()
      }

      trainSession.status = 'canceled'
      await this._trainSessionService.setTrainingSession(botId, trainSession)

      return this._engine.cancelTraining(trainSession.key)
    }
  }
}

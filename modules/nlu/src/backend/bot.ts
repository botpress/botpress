import * as sdk from 'botpress/sdk'
import { NLU } from 'botpress/sdk'
import _ from 'lodash'
import ms from 'ms'

import { createApi } from '../api'

import { BotDoesntSpeakLanguageError } from './errors'
import ScopedModelService from './model-service'
import { ScopedPredictionHandler } from './prediction-handler'
import { getSeed } from './seed-service'
import TrainSessionService from './train-session-service'

const TRAIN_LOCK = ms('1m')

export class Bot {
  private _config: sdk.BotConfig
  private _defaultLanguage: string
  private _languages: string[]
  private _modelsByLang: _.Dictionary<NLU.ModelId>

  private _modelService: ScopedModelService
  private _predictor: ScopedPredictionHandler
  private _needsTrainingWatcher: sdk.ListenHandle

  constructor(
    private _botId: string,
    private _bp: typeof sdk | undefined,
    private _engine: NLU.Engine,
    private _trainSessionService: TrainSessionService
  ) {}

  public async mount() {
    const { _bp, _engine, _botId } = this
    const bot = await _bp.bots.getBotById(_botId)

    const needsTrainingWatcher = this._registerNeedTrainingWatcher()

    const { defaultLanguage } = bot
    const languages = _.intersection(bot.languages, _engine.getLanguages())
    if (bot.languages.length !== languages.length) {
      const missingLangMsg = `Bot ${this._botId} has configured languages that are not supported by language sources. Configure a before incoming hook to call an external NLU provider for those languages.`
      _bp.logger.forBot(this._botId).warn(missingLangMsg, { notSupported: _.difference(bot.languages, languages) })
    }

    this._config = bot
    this._defaultLanguage = defaultLanguage
    this._languages = languages
    this._modelsByLang = {}

    const modelService = new ScopedModelService(_bp, this._botId)
    await modelService.initialize()

    const predictor = new ScopedPredictionHandler(
      _engine,
      modelService,
      _bp.NLU.modelIdService,
      _bp.logger.forBot(this._botId),
      { modelsByLang: this._modelsByLang, defaultLanguage }
    )

    this._modelService = modelService
    this._predictor = predictor
    this._needsTrainingWatcher = needsTrainingWatcher

    await Promise.map(this._languages, this._loadLatest)
  }

  public async unmount() {
    const { _languages, _trainSessionService } = this

    for (const language of _languages) {
      const ts = await _trainSessionService.getTrainingSession(this._botId, language)
      if (ts.status === 'training') {
        await this.cancelTraining(ts.language)
      }

      await this._trainSessionService.removeTrainingSession(this._botId, ts)
    }

    this._needsTrainingWatcher.remove()

    for (const model of Object.values(this._modelsByLang)) {
      this._engine.unloadModel(model)
    }
  }

  public load = async (modelId: NLU.ModelId) => {
    const model = await this._modelService.getModel(modelId)
    if (!model) {
      const stringId = this._bp.NLU.modelIdService.toString(modelId)
      throw new Error(`Model ${stringId} not found on file system.`)
    }

    this._modelsByLang[model.languageCode] = modelId
    await this._engine.loadModel(model)
  }

  public train = async (language: string, lock: sdk.RedisLock): Promise<NLU.ModelId> => {
    const { _bp, _trainSessionService, _engine, _languages, _modelService } = this

    if (!_languages.includes(language)) {
      throw new BotDoesntSpeakLanguageError(this._botId, language)
    }

    const trainSet: NLU.TrainingSet = await this._getTrainSet(language)

    const trainSession = await _trainSessionService.getTrainingSession(this._botId, language)

    await _trainSessionService.setTrainingSession(this._botId, trainSession)

    const progressCallback = async (progress: number) => {
      lock.extend(TRAIN_LOCK)
      trainSession.status = 'training'
      trainSession.progress = progress
      await _trainSessionService.setTrainingSession(this._botId, trainSession)
    }

    const previousModel = this._modelsByLang[language]
    const options: sdk.NLU.TrainingOptions = { previousModel, progressCallback }

    const model = await _engine.train(trainSession.key, trainSet, options)
    await _modelService.saveModel(model)

    trainSession.status = 'done'
    await _trainSessionService.setTrainingSession(this._botId, trainSession)

    const modelId = _bp.NLU.modelIdService.toId(model)
    this._modelsByLang[language] = modelId

    return modelId
  }

  public cancelTraining = async (language: string) => {
    if (!this._languages.includes(language)) {
      throw new BotDoesntSpeakLanguageError(this._botId, language)
    }

    const trainSession: sdk.NLU.TrainingSession = await this._trainSessionService.getTrainingSession(
      this._botId,
      language
    )

    if (trainSession && trainSession.status === 'training') {
      trainSession.status = 'canceled'
      await this._trainSessionService.setTrainingSession(this._botId, trainSession)
      return this._engine.cancelTraining(trainSession.key)
    }
  }

  public predict = async (textInput: string, anticipatedLanguage?: string) => {
    const { _predictor, _defaultLanguage } = this
    return _predictor.predict(textInput, anticipatedLanguage ?? _defaultLanguage)
  }

  private _registerNeedTrainingWatcher = () => {
    return this._bp.ghost.forBot(this._botId).onFileChanged(async filePath => {
      const hasPotentialNLUChange = filePath.includes('/intents/') || filePath.includes('/entities/')
      if (!hasPotentialNLUChange) {
        return
      }
      return Promise.map(this._languages, this._checkIfNeedsTraining)
    })
  }

  private async _checkIfNeedsTraining(language: string) {
    const { _engine, _trainSessionService } = this

    const trainSession = await _trainSessionService.getTrainingSession(this._botId, language)
    if (trainSession?.status === 'training') {
      return // do not send a needs-training event if currently training
    }

    const modelId = await this._getId(language)
    if (_engine.hasModel(modelId)) {
      return
    }

    trainSession.status = 'needs-training'
    return _trainSessionService.setTrainingSession(this._botId, trainSession)
  }

  private _loadLatest = async (language: string) => {
    const { _trainSessionService } = this

    const modelId = await this._getId(language)

    try {
      await this.load(modelId)
    } catch (err) {
      const trainSession = await _trainSessionService.getTrainingSession(this._botId, language)
      trainSession.status = 'needs-training'
      await _trainSessionService.setTrainingSession(this._botId, trainSession)
    }
  }

  private _getId = async (language: string) => {
    const { _bp, _engine } = this

    const trainSet = await this._getTrainSet(language)

    const specifications = _engine.getSpecifications()
    return _bp.NLU.modelIdService.makeId({
      ...trainSet,
      specifications
    })
  }

  private _getTrainSet = async (language: string) => {
    const { _bp, _config } = this

    const nluRepository = await createApi(_bp, this._botId)
    const intentDefs = await nluRepository.fetchIntentsWithQNAs()
    const entityDefs = await nluRepository.fetchEntities()

    return <NLU.TrainingSet>{
      intentDefs,
      entityDefs,
      languageCode: language,
      seed: getSeed(_config)
    }
  }
}

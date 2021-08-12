import { TrainingStatus } from '@botpress/nlu-client'
import * as sdk from 'botpress/sdk'
import crypto from 'crypto'
import _ from 'lodash'
import { StanEngine } from 'src/backend/stan'
import { mapTrainSet, mapPredictOutput } from '../stan/api-mapper'
import { DefinitionsRepository } from './definitions-repository'
import { BotDoesntSpeakLanguageError } from './errors'
import { Model, IModelRepository } from './model-repo'
import { TrainingState, EventUnderstanding, TrainingSession } from './typings'

interface BotDefinition {
  botId: string
  defaultLanguage: string
  languages: string[]
  seed: number
}

interface TrainingSet {
  intentDefs: sdk.NLU.IntentDefinition[]
  entityDefs: sdk.NLU.EntityDefinition[]
  languageCode: string
  seed: number // seeds random number generator in nlu training
}

type RawEventUnderstanding = Omit<EventUnderstanding, 'detectedLanguage'>

export class Bot {
  private _botId: string
  private _defaultLanguage: string
  private _languages: string[]
  private _seed: number

  private _needTrainingWatcher: sdk.ListenHandle

  constructor(
    bot: BotDefinition,
    private _engine: StanEngine,
    private _defRepo: DefinitionsRepository,
    private _modelRepo: IModelRepository,
    private _trainStateListener: (ts: TrainingSession) => void,
    private _logger: sdk.Logger
  ) {
    this._botId = bot.botId
    this._defaultLanguage = bot.defaultLanguage
    this._languages = bot.languages
    this._seed = bot.seed
  }

  get id() {
    return this._botId
  }

  public async mount() {
    this._needTrainingWatcher = this._registerNeedTrainingWatcher()
  }

  public async unmount() {
    // TODO: stop all trainings
    this._needTrainingWatcher.remove()
  }

  public train = async (language: string): Promise<void> => {
    const { _engine, _languages, _defRepo: _defService, _botId } = this

    if (!_languages.includes(language)) {
      throw new BotDoesntSpeakLanguageError(_botId, language)
    }

    const bpTrainSet = await this._getTrainSet(language)
    const stanTrainSet = mapTrainSet(bpTrainSet)

    return new Promise(async (resolve, reject) => {
      const modelId = await _engine.startTraining(this._botId, stanTrainSet)

      await this._modelRepo.set({
        botId: this._botId,
        language,
        modelId,
        state: 'training',
        definitionHash: this._hashTrainSet(bpTrainSet)
      })

      const name = 'something'
      this._engine.trainWatcher.for(this._botId, modelId).addListener({
        name,
        cb: async ts => {
          if (ts.status === 'training-pending' || ts.status === 'training') {
            this._trainStateListener({ ...ts, botId: this._botId, language })
            return
          }

          if (ts.status === 'errored' && ts.error?.type === 'already-started') {
            // no notification needed to websocket
            this._logger.info(`Training ${_botId}:${language} already started`)
            this._engine.trainWatcher.for(this._botId, modelId).rmListener({ name, cb: () => {} })
            resolve()
            return
          }

          await this._modelRepo.del({
            botId: this._botId,
            language,
            state: 'ready'
          })

          if (ts.status === 'done') {
            this._trainStateListener({ ...ts, botId: this._botId, language })
            this._engine.trainWatcher.for(this._botId, modelId).rmListener({ name, cb: () => {} })

            await this._modelRepo.set({
              botId: this._botId,
              language,
              modelId,
              state: 'ready',
              definitionHash: this._hashTrainSet(bpTrainSet)
            })

            resolve()
            return
          }

          if (ts.status === 'canceled') {
            this._trainStateListener({ status: 'needs-training', progress: 0, botId: this._botId, language })
            this._logger.info(`Training ${_botId}:${language} was canceled with success`)
            this._engine.trainWatcher.for(this._botId, modelId).rmListener({ name, cb: () => {} })
            resolve()
            return
          }

          if (ts.status === 'errored' && ts.error?.type === 'unknown') {
            this._trainStateListener({ ...ts, botId: this._botId, language })
            const err = new Error(ts.error.message)
            err.stack = ts.error.stackTrace
            this._engine.trainWatcher.for(this._botId, modelId).rmListener({ name, cb: () => {} })
            reject(err)
            return
          }
        }
      })
    })
  }

  private _hashTrainSet = (ts: TrainingSet) => {
    return crypto
      .createHash('sha1')
      .update(JSON.stringify(ts))
      .digest('hex')
  }

  public getTraining = async (language: string): Promise<TrainingState> => {
    const _default = { status: <TrainingStatus>'needs-training', progress: 0 }

    const currentTraining = await this._modelRepo.get({ botId: this._botId, language, state: 'training' })
    if (currentTraining) {
      const trainState = await this._engine.getTraining(this._botId, currentTraining.modelId)
      if (!trainState) {
        return _default
      }

      const { status, progress } = trainState
      return { progress, status: this._mapStatus(status) }
    }

    const model = await this._modelRepo.get({ botId: this._botId, language, state: 'ready' })
    if (model) {
      const trainState = await this._engine.getTraining(this._botId, model.modelId)
      if (!trainState) {
        return _default
      }

      const { status, progress } = trainState
      const isDirty = await this._isDirty(model)
      return isDirty ? _default : { progress, status: this._mapStatus(status) }
    }

    return _default
  }

  private _mapStatus = (status: TrainingStatus): sdk.NLU.TrainingStatus => {
    const needsTrainingsStatuses: TrainingStatus[] = ['errored', 'canceled']
    if (needsTrainingsStatuses.includes(status)) {
      return 'needs-training'
    }
    return status
  }

  public cancelTraining = async (language: string) => {
    if (!this._languages.includes(language)) {
      throw new BotDoesntSpeakLanguageError(this._botId, language)
    }

    this._trainStateListener({ botId: this._botId, language, status: 'canceled', progress: 0 })
    const model = await this._modelRepo.get({ botId: this._botId, language, state: 'training' })
    if (model) {
      return this._engine.cancelTraining(this._botId, model.modelId)
    }
  }

  private async _getTrainSet(languageCode: string): Promise<TrainingSet> {
    const trainDefinitions = await this._defRepo.getTrainDefinitions(this._botId)

    return {
      ...trainDefinitions,
      languageCode,
      seed: this._seed
    }
  }

  private _registerNeedTrainingWatcher = () => {
    return this._defRepo.onFileChanged(this._botId, async filePath => {
      const hasPotentialNLUChange = filePath.includes('/intents/') || filePath.includes('/entities/')
      if (!hasPotentialNLUChange) {
        return
      }

      await Promise.map(this._languages, async language => {
        const model = await this._modelRepo.get({ botId: this._botId, state: 'ready', language })
        const isDirty = !model || this._isDirty(model)
        if (isDirty) {
          this._trainStateListener({ status: 'needs-training', progress: 0, botId: this._botId, language })
        }
      })
    })
  }

  private _isDirty = async (model: Model) => {
    const ts = await this._getTrainSet(model.language)
    const hash = this._hashTrainSet(ts)
    return model?.definitionHash !== hash
  }

  public predict = async (textInput: string, anticipatedLanguage?: string) => {
    const modelsByLang = await this._getModelsByLang()

    let detectedLanguage: string | undefined
    try {
      detectedLanguage = await this._engine.detectLanguage(this._botId, textInput, Object.values(modelsByLang))
    } catch (err) {
      let msg = `An error occured when detecting language for input "${textInput}"\n`
      msg += `Falling back on default language: ${this._defaultLanguage}.`
      this._logger.attachError(err).error(msg)
    }

    let nluResults: RawEventUnderstanding | undefined

    const isDefined = _.negate(_.isUndefined)
    const languagesToTry = _([detectedLanguage, anticipatedLanguage, this._defaultLanguage])
      .filter(isDefined)
      .uniq()
      .value()

    for (const lang of languagesToTry) {
      const res = await this.tryPredictInLanguage(textInput, lang)
      nluResults = res && { ...res }

      if (!this.isEmpty(nluResults) && !this.isError(nluResults)) {
        break
      }
    }

    if (this.isEmpty(nluResults)) {
      throw new Error(`No model found for the following languages: ${languagesToTry}`)
    }

    return { ...nluResults, detectedLanguage }
  }

  private async tryPredictInLanguage(textInput: string, language: string): Promise<RawEventUnderstanding | undefined> {
    const modelsByLang = await this._getModelsByLang()
    if (!modelsByLang[language]) {
      return
    }

    try {
      const rawOriginalOutput = await this._engine.predict(this._botId, textInput, modelsByLang[language])
      const originalOutput = mapPredictOutput(rawOriginalOutput)
      const { spellChecked } = originalOutput
      return { ...originalOutput, spellChecked, errored: false, language }
    } catch (err) {
      const modelId = modelsByLang[language]
      const msg = `An error occured when predicting for input "${textInput}" with model ${modelId}`
      this._logger.attachError(err).error(msg)

      return { errored: true, language }
    }
  }

  private async _getModelsByLang() {
    const queryResult = await this._modelRepo.query({ botId: this._botId, state: 'ready' })
    return _.mapValues(queryResult ?? {}, ({ modelId }) => modelId)
  }

  private isEmpty(nluResults: RawEventUnderstanding | undefined): nluResults is undefined {
    return !nluResults
  }

  private isError(nluResults: RawEventUnderstanding): boolean {
    return !nluResults || nluResults.errored
  }
}

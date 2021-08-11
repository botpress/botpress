import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import { IStanEngine } from 'src/backend/stan'
import { mapTrainSet, mapPredictOutput } from '../stan/api-mapper'
import { DefinitionsRepository } from './definitions-repository'
import { BotDoesntSpeakLanguageError } from './errors'
import { ModelRepository } from './model-repo'
import { I, TrainingState, EventUnderstanding } from './typings'

type DirtyModelCallback = (language: string) => Promise<void>

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

export type IBot = I<Bot>

type RawEventUnderstanding = Omit<EventUnderstanding, 'detectedLanguage'>

export class Bot {
  private _botId: string
  private _defaultLanguage: string
  private _languages: string[]
  private _seed: number

  private _needTrainingWatcher: sdk.ListenHandle
  private _dirtyModelsListeners: DirtyModelCallback[] = []

  constructor(
    private bot: BotDefinition,
    private _engine: IStanEngine,
    private _defRepo: DefinitionsRepository,
    private _modelRepo: ModelRepository,
    private _trainStateListener: (ts: TrainingState) => void,
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

  public startTraining = async (language: string): Promise<string> => {
    const { _engine, _languages, _defRepo: _defService, _botId } = this

    if (!_languages.includes(language)) {
      throw new BotDoesntSpeakLanguageError(_botId, language)
    }

    const bpTrainSet = await this.getTrainSet(language)
    const stanTrainSet = mapTrainSet(bpTrainSet)

    const modelId = await _engine.startTraining(this._botId, stanTrainSet)

    // _engine.addTrainListener(this._botId, modelId, progressCallback)

    return modelId
  }

  public getTraining = async (language: string): Promise<TrainingState> => {
    const _default = { status: 'needs-training', progress: 0 }
    const model = await this._modelRepo.get({ botId: this._botId, language, state: 'training' })
    if (model) {
      return this._engine.getTraining(this._botId, model.modelId) ?? _default
    }
    return _default as TrainingState
  }

  public cancelTraining = async (language: string) => {
    if (!this._languages.includes(language)) {
      throw new BotDoesntSpeakLanguageError(this._botId, language)
    }

    const model = await this._modelRepo.get({ botId: this._botId, language, state: 'training' })
    if (model) {
      return this._engine.cancelTraining(this._botId, model.modelId)
    }
  }

  private async getTrainSet(languageCode: string): Promise<TrainingSet> {
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
      await Promise.map(this._languages, this._notifyListeners)
    })
  }

  private _notifyListeners = (language: string) => {
    return Promise.mapSeries(this._dirtyModelsListeners, l => {
      return l(language)
    })
  }

  public predict = async (textInput: string, anticipatedLanguage?: string) => {
    const { defaultLanguage } = this.bot

    const modelsByLang = await this._getModelsByLang()

    let detectedLanguage: string | undefined
    try {
      detectedLanguage = await this._engine.detectLanguage(this._botId, textInput, Object.values(modelsByLang))
    } catch (err) {
      let msg = `An error occured when detecting language for input "${textInput}"\n`
      msg += `Falling back on default language: ${defaultLanguage}.`
      this._logger.attachError(err).error(msg)
    }

    let nluResults: RawEventUnderstanding | undefined

    const isDefined = _.negate(_.isUndefined)
    const languagesToTry = _([detectedLanguage, anticipatedLanguage, defaultLanguage])
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

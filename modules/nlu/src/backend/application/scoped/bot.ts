import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import { StanEngine } from 'src/backend/stan'
import modelIdService, { ModelId } from 'src/backend/stan/model-id-service'
import { mapTrainSet } from '../../stan/api-mapper'
import { BotDoesntSpeakLanguageError } from '../errors'
import { Predictor, ProgressCallback, Trainable, I } from '../typings'

import { IDefinitionsService } from './definitions-service'
import { ScopedPredictionHandler } from './prediction-handler'

interface BotDefinition {
  botId: string
  defaultLanguage: string
  languages: string[]
}

export type IBot = I<Bot>

export class Bot implements Trainable, Predictor {
  private _botId: string
  private _defaultLanguage: string
  private _languages: string[]

  private _modelsByLang: _.Dictionary<ModelId> = {}
  private _trainingsByLang: _.Dictionary<ModelId> = {}

  private _predictor: ScopedPredictionHandler

  constructor(
    bot: BotDefinition,
    private _engine: StanEngine,
    private _defService: IDefinitionsService,
    private _modelIdService: typeof modelIdService,
    private _logger: sdk.Logger
  ) {
    this._botId = bot.botId
    this._defaultLanguage = bot.defaultLanguage
    this._languages = bot.languages

    this._predictor = new ScopedPredictionHandler(
      {
        defaultLanguage: this._defaultLanguage,
        botId: this._botId
      },
      _engine,
      this._modelIdService,
      this._modelsByLang,
      this._logger
    )
  }

  public async mount() {
    await this._defService.initialize()
  }

  public async unmount() {
    await this._defService.teardown()
    for (const [_botId, modelId] of Object.entries(this._modelsByLang)) {
      // TODO: add a route to unload a single model without pruning
      // this._engine.unloadModel(modelId)
      delete this._modelsByLang[modelId.languageCode]
    }
  }

  // TODO: rename for setModel
  public load = async (modelId: ModelId) => {
    this._modelsByLang[modelId.languageCode] = modelId
  }

  public train = async (language: string, progressCallback: ProgressCallback): Promise<ModelId> => {
    const { _engine, _languages, _defService, _botId } = this

    if (!_languages.includes(language)) {
      throw new BotDoesntSpeakLanguageError(_botId, language)
    }

    const bpTrainSet = await _defService.getTrainSet(language)
    const stanTrainSet = mapTrainSet(bpTrainSet)

    const modelId = await _engine.startTraining(this._botId, stanTrainSet)

    this._trainingsByLang[language] = modelId

    await _engine.waitForTraining(this._botId, modelId, progressCallback)

    return modelId
  }

  public cancelTraining = async (language: string) => {
    if (!this._languages.includes(language)) {
      throw new BotDoesntSpeakLanguageError(this._botId, language)
    }

    if (this._trainingsByLang[language]) {
      return this._engine.cancelTraining(this._botId, this._trainingsByLang[language])
    }
  }

  public predict = async (textInput: string, anticipatedLanguage?: string) => {
    const { _predictor, _defaultLanguage } = this
    return _predictor.predict(textInput, anticipatedLanguage ?? _defaultLanguage)
  }
}

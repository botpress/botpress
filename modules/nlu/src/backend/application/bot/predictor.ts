import Bluebird from 'bluebird'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import { ModelStateService } from '../model-state'
import { NLUClientWrapper } from '../nlu-client'
import { mapPredictOutput } from '../nlu-client/api-mapper'
import { BotDefinition } from '../typings'

type EventUnderstanding = Omit<sdk.IO.EventUnderstanding, 'includedContexts' | 'ms'>

const isDefined = <T>(x: T | undefined): x is T => _.negate(_.isUndefined)(x)

export class Predictor {
  private _botId: string
  private _languages: string[]
  private _defaultLanguage: string

  constructor(
    bot: BotDefinition,
    private _nluClient: NLUClientWrapper,
    private _modelStateService: ModelStateService,
    private _logger: sdk.Logger
  ) {
    this._botId = bot.botId
    this._defaultLanguage = bot.defaultLanguage
    this._languages = bot.languages
  }

  public predict = async (textInput: string, anticipatedLanguage?: string): Promise<EventUnderstanding> => {
    const allModels = await Bluebird.map(this._languages, l =>
      this._modelStateService.get({ botId: this._botId, language: l, statusType: 'ready' })
    )

    const models = allModels.filter(isDefined)

    let detectedLanguage: string | undefined
    try {
      detectedLanguage = await this._nluClient.detectLanguage(
        this._botId,
        textInput,
        models.map(m => m.modelId)
      )
    } catch (err) {
      let msg = `An error occured when detecting language for input "${textInput}"\n`
      msg += `Falling back on default language: ${this._defaultLanguage}.`
      this._logger.attachError(err).error(msg)
    }

    let nluResults: Omit<EventUnderstanding, 'detectedLanguage'> | undefined

    const languagesToTry = _([detectedLanguage, anticipatedLanguage, this._defaultLanguage])
      .filter(isDefined)
      .uniq()
      .value()

    for (const lang of languagesToTry) {
      const { modelId } = models.find(m => m.language === lang) ?? {}
      if (!modelId) {
        continue
      }

      const res = await this.tryPredictInLanguage(textInput, lang, modelId)
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

  private async tryPredictInLanguage(
    textInput: string,
    language: string,
    modelId: string
  ): Promise<Omit<EventUnderstanding, 'detectedLanguage'> | undefined> {
    try {
      const response = await this._nluClient.predict(this._botId, textInput, modelId)
      const originalOutput = mapPredictOutput(response)
      return { ...originalOutput, errored: false, language }
    } catch (err) {
      const msg = `An error occured when predicting for input "${textInput}" with model ${modelId}`
      this._logger.attachError(err).error(msg)
      return { errored: true, language }
    }
  }

  private isEmpty(nluResults: Omit<EventUnderstanding, 'detectedLanguage'> | undefined): nluResults is undefined {
    return !nluResults
  }

  private isError(nluResults: Omit<EventUnderstanding, 'detectedLanguage'>): boolean {
    return !nluResults || nluResults.errored
  }
}

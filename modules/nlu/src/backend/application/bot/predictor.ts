import Bluebird from 'bluebird'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import { ModelStateService } from '../model-state-service'
import { NLUClientWrapper } from '../nlu-client'
import { mapPredictOutput } from '../nlu-client/api-mapper'
import { BotDefinition } from '../typings'

type EventUnderstanding = Omit<sdk.IO.EventUnderstanding, 'includedContexts' | 'ms'>
type RawEventUnderstanding = Omit<EventUnderstanding, 'detectedLanguage'>

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
      this._modelStateService.getLocalModelState(this._botId, l)
    )

    const modelsByLang = _(allModels)
      .filter(isDefined)
      .groupBy(m => m.language)
      .mapValues(_.first)
      .pickBy(isDefined)
      .mapValues(m => m.id)
      .value()

    let detectedLanguage: string | undefined
    try {
      detectedLanguage = await this._nluClient.detectLanguage(this._botId, textInput, Object.values(modelsByLang))
    } catch (err) {
      let msg = `An error occured when detecting language for input "${textInput}"\n`
      msg += `Falling back on default language: ${this._defaultLanguage}.`
      this._logger.attachError(err).error(msg)
    }

    let nluResults: RawEventUnderstanding | undefined

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
    const model = await this._modelStateService.getLocalModelState(this._botId, language)
    if (!model) {
      return
    }

    try {
      const response = await this._nluClient.predict(this._botId, textInput, model.id)
      const originalOutput = mapPredictOutput(response)
      return { ...originalOutput, errored: false, language }
    } catch (err) {
      const msg = `An error occured when predicting for input "${textInput}" with model ${model.id}`
      this._logger.attachError(err).error(msg)

      return { errored: true, language }
    }
  }

  private isEmpty(nluResults: RawEventUnderstanding | undefined): nluResults is undefined {
    return !nluResults
  }

  private isError(nluResults: RawEventUnderstanding): boolean {
    return !nluResults || nluResults.errored
  }
}

import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import { StanEngine } from 'src/backend/stan'
import { mapPredictOutput } from '../../stan/api-mapper'
import { ModelStateService } from '../model-state-service'
import { EventUnderstanding } from '../typings'

interface BotDefinition {
  botId: string
  defaultLanguage: string
  languages: string[]
  seed: number
}

type RawEventUnderstanding = Omit<EventUnderstanding, 'detectedLanguage'>

export interface IPredictor {
  predict: (textInput: string, anticipatedLanguage?: string) => Promise<EventUnderstanding>
}

export class Predictor implements IPredictor {
  private _botId: string
  private _defaultLanguage: string

  constructor(
    bot: BotDefinition,
    private _engine: StanEngine,
    private _modelStateService: ModelStateService,
    private _logger: sdk.Logger
  ) {
    this._botId = bot.botId
    this._defaultLanguage = bot.defaultLanguage
  }

  public predict = async (textInput: string, anticipatedLanguage?: string) => {
    const modelsByLang = await this._getModelsByLang()

    let detectedLanguage: string | undefined
    try {
      detectedLanguage = await this._engine.detectLanguage(
        this._botId,
        textInput,
        _(modelsByLang)
          .mapValues(m => m.id)
          .values()
          .value()
      )
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
      const rawOriginalOutput = await this._engine.predict(this._botId, textInput, modelsByLang[language].id)
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

  private async _getModelsByLang(): Promise<_.Dictionary<{ id: string }>> {
    const allModels = await this._modelStateService.getAllModels(this._botId)
    return _(allModels)
      .groupBy(m => m.language)
      .mapValues(_.first)
      .pickBy(_.negate(_.isUndefined))
      .value()
  }

  private isEmpty(nluResults: RawEventUnderstanding | undefined): nluResults is undefined {
    return !nluResults
  }

  private isError(nluResults: RawEventUnderstanding): boolean {
    return !nluResults || nluResults.errored
  }
}

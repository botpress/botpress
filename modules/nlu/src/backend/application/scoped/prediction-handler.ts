import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { IStanEngine } from 'src/backend/stan'
import mergeSpellChecked from '../../election/spellcheck-handler'
import { mapPredictOutput } from '../../stan/api-mapper'
import { EventUnderstanding } from '../typings'

interface BotDefinition {
  botId: string
  defaultLanguage: string
}

// TODO: rm this class and put all the logic inside Bot. This class no longer has a reason to be.
export class ScopedPredictionHandler {
  private defaultLanguage: string
  private _botId: string

  constructor(
    bot: BotDefinition,
    private _engine: IStanEngine,
    private _modelsByLang: _.Dictionary<string>,
    private _logger: sdk.Logger
  ) {
    this.defaultLanguage = bot.defaultLanguage
    this._botId = bot.botId
  }

  async predict(textInput: string, anticipatedLanguage: string): Promise<EventUnderstanding> {
    const t0 = Date.now()

    const { defaultLanguage } = this

    let detectedLanguage: string | undefined
    try {
      detectedLanguage = await this._engine.detectLanguage(this._botId, textInput, Object.values(this._modelsByLang))
    } catch (err) {
      let msg = `An error occured when detecting language for input "${textInput}"\n`
      msg += `Falling back on default language: ${defaultLanguage}.`
      this._logger.attachError(err).error(msg)
    }

    let nluResults: EventUnderstanding | undefined

    const isDefined = _.negate(_.isUndefined)
    const languagesToTry = _([detectedLanguage, anticipatedLanguage, defaultLanguage])
      .filter(isDefined)
      .uniq()
      .value()

    for (const lang of languagesToTry) {
      const res = await this.tryPredictInLanguage(textInput, lang)
      const ms = Date.now() - t0
      nluResults = res && { ...res, ms }

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
    language: string
  ): Promise<Omit<EventUnderstanding, 'ms'> | undefined> {
    if (!this._modelsByLang[language]) {
      return
    }

    try {
      const rawOriginalOutput = await this._engine.predict(this._botId, textInput, this._modelsByLang[language])
      const originalOutput = mapPredictOutput(rawOriginalOutput)

      const { spellChecked } = originalOutput
      if (spellChecked && spellChecked !== textInput) {
        const rawSpellCheckedOutput = await this._engine.predict(
          this._botId,
          spellChecked,
          this._modelsByLang[language]
        )
        const spellCheckedOutput = mapPredictOutput(rawSpellCheckedOutput)
        const merged = mergeSpellChecked(originalOutput, spellCheckedOutput)
        return { ...merged, spellChecked, errored: false, language }
      }
      return { ...originalOutput, spellChecked, errored: false, language }
    } catch (err) {
      const modelId = this._modelsByLang[language]
      const msg = `An error occured when predicting for input "${textInput}" with model ${modelId}`
      this._logger.attachError(err).error(msg)

      return { errored: true, language }
    }
  }

  private isEmpty(nluResults: EventUnderstanding | undefined): nluResults is undefined {
    return !nluResults
  }

  private isError(nluResults: EventUnderstanding): boolean {
    return !nluResults || nluResults.errored
  }
}

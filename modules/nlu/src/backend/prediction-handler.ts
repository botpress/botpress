import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import mergeSpellChecked from './election/spellcheck-handler'
import { PredictOutput } from './election/typings'

export interface ModelProvider {
  getLatestModel: (lang: string) => Promise<sdk.NLU.Model | undefined>
}

export class PredictionHandler {
  constructor(
    private modelsByLang: _.Dictionary<string>,
    private modelProvider: ModelProvider,
    private engine: sdk.NLU.Engine,
    private anticipatedLanguage: string,
    private defaultLanguage: string,
    private logger: sdk.Logger
  ) {}

  async predict(textInput: string, includedContexts: string[]) {
    const modelCacheState = _.mapValues(this.modelsByLang, model => ({ model, loaded: this.engine.hasModel(model) }))

    const missingModels = _(modelCacheState)
      .pickBy(mod => !mod.loaded)
      .mapValues(({ model }) => model)
      .value()

    if (Object.keys(missingModels).length) {
      const formattedMissingModels = JSON.stringify(missingModels, undefined, 2)
      this.logger.warn(
        `About to detect language, but the following models are not loaded: \n${formattedMissingModels}\nMake sure you have enough cache space to fit all models for your bot.`
      )
    }

    const loadedModels = _(modelCacheState)
      .pickBy(mod => mod.loaded)
      .mapValues(({ model }) => model)
      .value()

    const detectedLanguage = await this.engine.detectLanguage(textInput, loadedModels)

    let nluResults: sdk.IO.EventUnderstanding | undefined

    const languagesToTry = _.uniq([detectedLanguage, this.anticipatedLanguage, this.defaultLanguage])

    for (const lang of languagesToTry) {
      nluResults = await this.tryPredictInLanguage(textInput, includedContexts, lang)
      if (!this.isEmptyOrError(nluResults)) {
        break
      }
    }

    if (this.isEmptyOrError(nluResults)) {
      throw new Error(`No model found for the following languages: ${languagesToTry}`)
    }

    return { ...nluResults, detectedLanguage }
  }

  private async tryPredictInLanguage(
    textInput: string,
    includedContexts: string[],
    lang: string
  ): Promise<sdk.IO.EventUnderstanding | undefined> {
    if (!this.modelsByLang[lang] || !this.engine.hasModel(this.modelsByLang[lang])) {
      const model = await this.modelProvider.getLatestModel(lang)
      if (!model) {
        return
      }
      this.modelsByLang[lang] = model.hash
      await this.engine.loadModel(model, model.hash)
    }

    const spellChecked = await this.engine.spellCheck(textInput, this.modelsByLang[lang])
    if (spellChecked !== textInput) {
      const originalOutput = await this.engine.predict(textInput, includedContexts, this.modelsByLang[lang])
      const spellCheckedOutput = await this.engine.predict(spellChecked, includedContexts, this.modelsByLang[lang])
      const merged = mergeSpellChecked(originalOutput as PredictOutput, spellCheckedOutput as PredictOutput)
      return { ...merged, spellChecked }
    }
    const output = await this.engine.predict(textInput, includedContexts, this.modelsByLang[lang])
    return { ...output, spellChecked }
  }

  private isEmptyOrError(nluResults: sdk.IO.EventUnderstanding | undefined) {
    return !nluResults || nluResults.errored
  }
}

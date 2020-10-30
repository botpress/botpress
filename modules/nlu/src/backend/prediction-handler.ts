import * as sdk from 'botpress/sdk'
import _ from 'lodash'

export interface ModelProvider {
  getLatestModel: (lang: string) => Promise<sdk.NLU.Model | undefined>
}

export class PredictionHandler {
  constructor(
    private modelProvider: ModelProvider,
    private engine: sdk.NLU.Engine,
    private anticipatedLanguage: string,
    private defaultLanguage: string
  ) {}

  async predict(textInput: string, includedContexts: string[]) {
    const detectedLanguage = await this.engine.detectLanguage(textInput)

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
    if (!this.engine.hasModelForLang(lang)) {
      const model = await this.modelProvider.getLatestModel(lang)
      if (!model) {
        return
      }
      await this.engine.loadModel(model)
    }
    return this.engine.predict(textInput, includedContexts, lang)
  }

  private isEmptyOrError(nluResults: sdk.IO.EventUnderstanding | undefined) {
    return !nluResults || nluResults.errored
  }
}

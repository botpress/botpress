import * as sdk from 'botpress/sdk'

type ModelGetter = (lang: string) => Promise<sdk.NLU.Model | undefined>

export class PredictionHandler {
  constructor(private getLatestModel: ModelGetter, private engine: sdk.NLU.Engine, private defaultLanguage: string) {}

  async predict(textInput: string, includedContexts: string[]) {
    const defaultResults = await this.engine.predict(textInput, includedContexts, this.defaultLanguage)
    const detectedLanguage = defaultResults.detectedLanguage
    const detectedIsDefault = detectedLanguage === this.defaultLanguage

    let nluResults = defaultResults
    if (!detectedIsDefault) {
      nluResults = await this.engine.predict(textInput, includedContexts, detectedLanguage)
    }

    if (this.isEmptyOrError(nluResults)) {
      nluResults = await this._loadAndPredict(textInput, includedContexts, detectedLanguage)
    }

    if (!detectedIsDefault && this.isEmptyOrError(nluResults)) {
      nluResults = await this._fallbackOnDefault(textInput, includedContexts, defaultResults)
    }

    if (this.isEmptyOrError(nluResults)) {
      const msg = detectedIsDefault
        ? `no model found for language (${this.defaultLanguage})`
        : `no model found for either bot's default language (${this.defaultLanguage}) or detected language (${detectedLanguage})`
      throw new Error(msg)
    }

    return nluResults
  }

  private isEmptyOrError(nluResults: sdk.IO.EventUnderstanding | undefined) {
    return !nluResults || (nluResults.error && nluResults.error === 'invalid_predictor')
  }

  private async _loadAndPredict(
    textInput: string,
    includedContexts: string[],
    language: string
  ): Promise<sdk.IO.EventUnderstanding | undefined> {
    const model = await this.getLatestModel(language)
    if (!model) {
      return
    }

    await this.engine.loadModel(model)
    return this.engine.predict(textInput, includedContexts, language)
  }

  private async _fallbackOnDefault(
    textInput: string,
    includedContexts: string[],
    defaultResults: sdk.IO.EventUnderstanding
  ) {
    if (!defaultResults.error) {
      return defaultResults
    }
    return this._loadAndPredict(textInput, includedContexts, this.defaultLanguage)
  }
}

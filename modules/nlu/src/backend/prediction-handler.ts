import * as sdk from 'botpress/sdk'

type ModelGetter = (lang: string) => Promise<sdk.NLU.Model | undefined>

export class PredictionHandler {
  constructor(private getLatestModel: ModelGetter, private engine: sdk.NLU.Engine, private defaultLanguage: string) {}

  async predict(textInput: string, includedContexts: string[]) {
    let language = this.defaultLanguage // TODO: use user's previously used language instead of bot's default
    const defaultResults = await this.engine.predict(textInput, includedContexts, language)

    let nluResults = defaultResults
    if (nluResults.detectedLanguage !== language) {
      language = nluResults.detectedLanguage
      nluResults = await this.engine.predict(textInput, includedContexts, language)
    }

    if (this.isEmptyOrError(nluResults)) {
      nluResults = await this._loadAndPredict(textInput, includedContexts, language)
    }

    if (this.isEmptyOrError(nluResults)) {
      nluResults = await this._fallbackOnDefault(defaultResults, textInput, includedContexts)
    }

    if (this.isEmptyOrError(nluResults)) {
      throw new Error(
        `no model found for either bot's default language (${this.defaultLanguage}) or detected language (${language})`
      )
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
    defaultResults: sdk.IO.EventUnderstanding,
    textInput: string,
    includedContexts: string[]
  ) {
    if (!defaultResults.error) {
      return defaultResults
    }
    return this._loadAndPredict(textInput, includedContexts, this.defaultLanguage)
  }
}

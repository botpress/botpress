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

    if (nluResults.error && nluResults.error === 'invalid_predictor') {
      const model = await this.getLatestModel(language)
      if (!model) {
        return this._fallbackOnDefault(defaultResults, language)
      }

      await this.engine.loadModel(model)
      nluResults = await this.engine.predict(textInput, includedContexts, language)
    }

    return nluResults
  }

  private _fallbackOnDefault(defaultResults: sdk.IO.EventUnderstanding, missingLang: string) {
    if (!defaultResults.error) {
      return defaultResults
    } else {
      throw new Error(`no model found for language ${missingLang}, training needed.`)
    }
  }
}

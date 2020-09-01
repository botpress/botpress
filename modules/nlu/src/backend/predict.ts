import * as sdk from 'botpress/sdk'

type ModelGetter = (lang: string) => Promise<sdk.NLU.Model | undefined>

export function makePredictor(getLatestModel: ModelGetter, engine: sdk.NLU.Engine, defaultLanguage: string) {
  return async function(textInput: string, includedContexts: string[]) {
    let language = defaultLanguage // TODO: use user's previously used language instead of bot's default

    const defaultResults = await engine.predict(textInput, includedContexts, language)

    let nluResults = defaultResults
    if (nluResults.detectedLanguage !== language) {
      language = nluResults.detectedLanguage
      nluResults = await engine.predict(textInput, includedContexts, language)
    }

    if (nluResults.error && nluResults.error === 'invalid_predictor') {
      const model = await getLatestModel(language)
      if (!model) {
        if (!defaultResults.error) {
          return defaultResults
        } else {
          throw new Error(`no model found for language ${language}, training needed.`)
        }
      }

      await engine.loadModel(model)
      nluResults = await engine.predict(textInput, includedContexts, language)
    }

    return nluResults
  }
}

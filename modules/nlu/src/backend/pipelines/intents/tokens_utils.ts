import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { LanguageProvider } from '../../typings'
import { sanitize } from '../language/sanitizer'
import { keepEntityValues } from '../slots/pre-processor'

const formatUtterance = _.flow([_.toLower, keepEntityValues, sanitize, _.trim])

const getTokensFromUtterances = (lang: string, languageProvider: LanguageProvider) => async (utterances: string[]) =>
  Promise.all(
    _.chain(utterances)
      .map(formatUtterance)
      .reject(_.isEmpty)
      .map(utteranceToTokens(lang, languageProvider))
      .value()
  )

const utteranceToTokens = (lang: string, languageProvider: LanguageProvider) => async (
  utterance: string
): Promise<string[]> => (await languageProvider.tokenize(utterance, lang)).map(sanitize)

export const getIntentsWithTokens = (lang, languageProvider) => async (
  intent: sdk.NLU.IntentDefinition
): Promise<any> => ({
  ...intent,
  tokens: await getTokensFromUtterances(lang, languageProvider)(intent.utterances[lang])
})

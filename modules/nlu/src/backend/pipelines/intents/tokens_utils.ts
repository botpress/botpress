import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { LanguageProvider, IntentDefinitionWithTokens } from '../../typings'
import { sanitize } from '../language/sanitizer'
import { keepEntityValues } from '../slots/pre-processor'

const formatUtterance = _.flow([_.toLower, keepEntityValues, sanitize, _.trim])

export const sanitizeUtterances = utterances =>
  _.chain(utterances)
    .map(formatUtterance)
    .reject(_.isEmpty)
    .value()

const getTokensFromUtterances = (lang: string, languageProvider: LanguageProvider) => async (utterances: string[]) =>
  Promise.all(sanitizeUtterances(utterances).map(utteranceToTokens(lang, languageProvider)))

const utteranceToTokens = (lang: string, languageProvider: LanguageProvider) => async (
  utterance: string
): Promise<string[]> => {
  const [res] = await languageProvider.tokenize([utterance], lang)
  return res.map(sanitize)
}

export const getIntentsWithTokens = (lang, languageProvider) => async (
  intent: sdk.NLU.IntentDefinition
): Promise<IntentDefinitionWithTokens> => ({
  ...intent,
  tokens: await getTokensFromUtterances(lang, languageProvider)(intent.utterances[lang])
})

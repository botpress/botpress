import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { IntentDefinitionWithTokens, LanguageProvider, TrainingPoint, Token2Vec } from '../../typings'
import { createl0PointsFromUtteranceTokens, createl1PointsFromUtteranceTokens } from '../language/ft_featurizer'

import { generateNoneIntent } from './none_intent_utils'

export const getContextsFromIntentDefs = (defs: IntentDefinitionWithTokens[]): string[] =>
  _.chain(defs)
    .flatMap(x => x.contexts)
    .uniq()
    .value()

export const getIntentsForContext = (intents: IntentDefinitionWithTokens[], context: string) =>
  intents.filter(intent => intent.contexts.includes(context))

const getPointsWithNone = async (
  intentsWTokens: IntentDefinitionWithTokens[],
  context: string,
  lang: string,
  langProvider: LanguageProvider
): Promise<IntentDefinitionWithTokens[]> => {
  const noneIntent = await generateNoneIntent(intentsWTokens, lang, context, langProvider)
  return intentsWTokens.concat(noneIntent)
}

const curateAndFlattenPoints = nestedPoints =>
  _.chain(nestedPoints)
    .flatten()
    .reject(_.isEmpty)
    .value()

export const getl1PointsForContext = async (
  intentsWTokens: IntentDefinitionWithTokens[],
  context: string,
  lang: string,
  langProvider: LanguageProvider,
  tfIdf,
  token2vec
): Promise<TrainingPoint[]> => {
  const intentsWithNone = await getPointsWithNone(intentsWTokens, context, lang, langProvider)

  const nestedPoints = await Promise.map(intentsWithNone, async intent =>
    Promise.map(
      intent.tokens,
      createl1PointsFromUtteranceTokens(intent.name, lang, langProvider, token2vec, context, tfIdf)
    )
  )

  return curateAndFlattenPoints(nestedPoints)
}

export const getl0PointsForContext = async (
  intentsWTokens: IntentDefinitionWithTokens[],
  context: string,
  lang: string,
  langProvider: LanguageProvider,
  tfIdf,
  token2vec: Token2Vec
): Promise<TrainingPoint[]> => {
  const intentsWithNone = await getPointsWithNone(intentsWTokens, context, lang, langProvider)

  const nestedPoints = await Promise.map(intentsWithNone, async intent =>
    Promise.map(
      intent.tokens,
      createl0PointsFromUtteranceTokens(intent.name, lang, langProvider, token2vec, context, tfIdf)
    )
  )

  return curateAndFlattenPoints(nestedPoints)
}

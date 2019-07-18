import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import { VError } from 'verror'

import { Model, Token2Vec } from '../../typings'
import { LanguageProvider } from '../../typings'

import {
  createl0ModelFromAllPoints,
  createl1ModelsFromAllPoints,
  getContextsFromIntentDefs,
  getPointsForContext
} from './context_utils'
import { predictl0, predictl1 } from './predictions_utils'
import { parsel0, parsel1, parseTfIdf } from './tfidf'

export const predict = async function(
  tokens: string[],
  includedContexts: string[],
  lang,
  langProvider,
  models,
  toolkit: typeof sdk.MLToolkit
): Promise<sdk.NLU.Intent[]> {
  if (!tokens.length) {
    return []
  }

  const { l0Tfidf, l1Tfidf, token2vec } = parseTfIdf(models.find(x => x.meta.type === 'intent-tfidf'))
  const l0Model = parsel0(toolkit, models.find(x => x.meta.type === 'intent-l0'))
  const l1Models = parsel1(toolkit, models.filter(x => x.meta.type === 'intent-l1'))

  if (!includedContexts.length) {
    includedContexts = ['global']
  }

  try {
    const l0 = await predictl0(lang, tokens, l0Tfidf, token2vec, langProvider, includedContexts, l0Model)
    const predictions = await predictl1(includedContexts, tokens, lang, token2vec, l1Tfidf, langProvider, l1Models, l0)

    return _.chain(predictions)
      .flatten()
      .orderBy('confidence', 'desc')
      .uniqBy(x => x.label)
      .map(x => ({ name: x.label, context: x.context, confidence: x.confidence }))
      .value()
  } catch (e) {
    throw new VError(e, `Error predicting intent for "${tokens.join(' ')}"`)
  }
}

export const train = async function(
  intentsWTokens: sdk.NLU.IntentDefinitionWithTokens[],
  modelHash: string,
  lang,
  toolkit: typeof sdk.MLToolkit,
  langProvider: LanguageProvider,
  tfIdf: { [context: string]: _.Dictionary<_.Dictionary<number>> },
  token2vec: Token2Vec
): Promise<Model[]> {
  const contexts = getContextsFromIntentDefs(intentsWTokens)

  const allPoints = await Promise.map(contexts, async context => {
    const intentsForContext = intentsWTokens.filter(intent => intent.contexts.includes(context))

    return {
      context,
      points: await getPointsForContext(intentsForContext, context, lang, langProvider, tfIdf, token2vec)
    }
  })

  const l1Models = await createl1ModelsFromAllPoints(allPoints, modelHash, toolkit)
  const l0Model = await createl0ModelFromAllPoints(allPoints, modelHash, toolkit)

  return [...l1Models, l0Model]
}

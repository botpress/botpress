import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import { VError } from 'verror'

import { IntentDefinitionWithTokens, LanguageProvider, Model, Token2Vec } from '../../typings'

import {
  createl0ModelFromAllPoints,
  createl1ModelsFromAllPoints,
  getContextsFromIntentDefs,
  getPointsForContext
} from './context_utils'
import { predictl0, predictl1 } from './predictions_utils'
import { getPayloadForInnerSVMProgress, identityProgress, notifyProgress } from './realtime_utils'
import { parsel0, parsel1, parseTfIdf } from './tfidf'

export const predict = async function(
  cannonicalTokens: string[],
  includedContexts: string[],
  lang: string,
  langProvider: LanguageProvider,
  models: Model[],
  toolkit: typeof sdk.MLToolkit
): Promise<sdk.NLU.Intent[]> {
  if (!cannonicalTokens.length) {
    return []
  }

  const { l0Tfidf, l1Tfidf, token2vec } = parseTfIdf(models.find(x => x.meta.type === 'intent-tfidf'))
  const l0Model = parsel0(toolkit, models.find(x => x.meta.type === 'intent-l0'))
  const l1Models = parsel1(toolkit, models.filter(x => x.meta.type === 'intent-l1'))

  if (!includedContexts.length) {
    includedContexts = ['global']
  }

  try {
    const l0 = await predictl0(lang, cannonicalTokens, l0Tfidf, token2vec, langProvider, includedContexts, l0Model)

    const predictions = await predictl1(
      includedContexts,
      cannonicalTokens,
      lang,
      token2vec,
      l1Tfidf,
      langProvider,
      l1Models,
      l0
    )

    return _.chain(predictions)
      .flatten()
      .orderBy('confidence', 'desc')
      .uniqBy(x => x.label)
      .map(x => ({ name: x.label, context: x.context, confidence: x.confidence }))
      .value()
  } catch (e) {
    throw new VError(e, `Error predicting intent for "${cannonicalTokens.join(' ')}"`)
  }
}

export const train = async function(
  intentsWTokens: IntentDefinitionWithTokens[],
  modelHash: string,
  lang,
  toolkit: typeof sdk.MLToolkit,
  langProvider: LanguageProvider,
  tfIdf: { [context: string]: _.Dictionary<_.Dictionary<number>> },
  token2vec: Token2Vec,
  realtime: typeof sdk.realtime,
  realtimePayload: typeof sdk.RealTimePayload
): Promise<Model[]> {
  const notify = notifyProgress(realtime, realtimePayload)
  const identityNotify = notify(identityProgress)
  identityNotify(0.1)

  const contexts = getContextsFromIntentDefs(intentsWTokens)

  const allPoints = await Promise.map(contexts, async context => {
    const intentsForContext = intentsWTokens.filter(intent => intent.contexts.includes(context))

    return {
      context,
      points: await getPointsForContext(intentsForContext, context, lang, langProvider, tfIdf, token2vec)
    }
  })

  identityNotify(0.2)

  // + 1 for l0
  const ctxLength = allPoints.length + 1
  const ratioedProgress = getPayloadForInnerSVMProgress(ctxLength)

  const l1Models = await createl1ModelsFromAllPoints(allPoints, modelHash, toolkit, notify, ratioedProgress(0))

  const l0Model = await createl0ModelFromAllPoints(
    allPoints,
    modelHash,
    toolkit,
    notify,
    ratioedProgress(l1Models.length)
  )

  return [...l1Models, l0Model]
}

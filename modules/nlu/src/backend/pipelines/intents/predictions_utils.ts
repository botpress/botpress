import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import math from 'mathjs'

import { GetZPercent } from '../../tools/math'
import { LanguageProvider, Token2Vec } from '../../typings'
import { getSentenceFeatures } from '../language/ft_featurizer'

// this means that the 3 best predictions are really close, do not change magic numbers
const predictionsReallyConfused = (predictions: sdk.MLToolkit.SVM.Prediction[]): boolean => {
  const bestOf3STD = math.std(predictions.slice(0, 3).map(p => p.confidence))
  return predictions.length > 2 && bestOf3STD <= 0.03
}

const predictL0Contextually = async function(
  l0Features: number[],
  includedContexts: string[],
  l0Predictor
): Promise<sdk.MLToolkit.SVM.Prediction[]> {
  const allL0 = await l0Predictor.predict(l0Features)
  const includedL0 = allL0.filter(c => includedContexts.includes(c.label))
  const totalL0Confidence = Math.min(1, _.sumBy(includedL0, c => c['confidence']))
  return includedL0.map(x => ({ ...x, confidence: x.confidence / totalL0Confidence }))
}

export const predictl1 = async (
  includedContexts: string[],
  tokens,
  lang,
  token2vec,
  l1Tfidf,
  langProvider,
  l1Models,
  l0
) => {
  return _.flatten(
    await Promise.map(includedContexts, async context => {
      const l1Vec = await getSentenceFeatures({
        lang: lang,
        doc: tokens,
        docTfidf: l1Tfidf[context],
        langProvider,
        token2vec: token2vec
      })

      const l1Features = [...l1Vec, tokens.length]
      const preds = await l1Models[context].predict(l1Features)

      const l0Confidence = _.get(l0.find(x => x.label === context), 'confidence', 0)

      if (preds.length <= 0) {
        return []
      }

      const firstBest = preds[0]

      if (preds.length === 1) {
        return [{ label: firstBest.label, l0Confidence, context, confidence: 1 }]
      }

      if (predictionsReallyConfused(preds)) {
        return [{ label: 'none', l0Confidence, context, confidence: 1 }] // refine confidence
      }

      const secondBest = preds[1]
      const lnstd = math.std(preds.map(x => Math.log(x.confidence))) // because we want a lognormal distribution
      let p1Conf = GetZPercent((Math.log(firstBest.confidence) - Math.log(secondBest.confidence)) / lnstd)

      if (isNaN(p1Conf)) {
        p1Conf = 0.5
      }

      return [
        { label: firstBest.label, l0Confidence, context, confidence: l0Confidence * p1Conf },
        { label: secondBest.label, l0Confidence, context, confidence: l0Confidence * (1 - p1Conf) }
      ]
    })
  )
}

export const predictl0 = async (
  lang: string,
  tokens: string[],
  l0Tfidf,
  token2vec: Token2Vec,
  langProvider: LanguageProvider,
  includedContexts: string[],
  l0Model
) => {
  const l0Vec = await getSentenceFeatures({
    lang,
    doc: tokens,
    docTfidf: l0Tfidf,
    token2vec,
    langProvider
  })

  const l0Features = [...l0Vec, tokens.length]
  return await predictL0Contextually(l0Features, includedContexts, l0Model)
}

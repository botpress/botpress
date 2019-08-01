import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import math from 'mathjs'

import { GetZPercent } from '../../tools/math'
import { L1Models, LanguageProvider, Model, Token2Vec } from '../../typings'
import { getSentenceFeatures } from '../language/ft_featurizer'

// this means that the 3 best predictions are really close, do not change magic numbers
const predictionsReallyConfused = (predictions: sdk.MLToolkit.SVM.Prediction[]) => {
  const intentsPreds = predictions.filter(x => x.label !== 'none')
  if (intentsPreds.length <= 2) {
    return false
  }

  const std = math.std(intentsPreds.map(p => p.confidence))
  const diff = (intentsPreds[0].confidence - intentsPreds[1].confidence) / std

  if (diff >= 2.5) {
    return false
  }

  const bestOf3STD = math.std(predictions.slice(0, 3).map(p => p.confidence))
  return bestOf3STD <= 0.03
}

const predictL0Contextually = async function(
  l0Features: number[],
  includedContexts: string[],
  l0Predictor: sdk.MLToolkit.SVM.Predictor
): Promise<sdk.MLToolkit.SVM.Prediction[]> {
  const allL0 = await l0Predictor.predict(l0Features)
  const includedL0 = allL0.filter(c => includedContexts.includes(c.label))
  const totalL0Confidence = Math.min(1, _.sumBy(includedL0, 'confidence'))
  return includedL0.map(x => ({ ...x, confidence: x.confidence / totalL0Confidence }))
}

export const predictl1 = async (
  includedContexts: string[],
  tokens: string[],
  lang: string,
  token2vec: Token2Vec,
  l1Tfidf: _.Dictionary<_.Dictionary<number>>,
  langProvider: LanguageProvider,
  l1Models: L1Models,
  l0: sdk.MLToolkit.SVM.Prediction[]
) => {
  return _.flatten(
    await Promise.map(includedContexts, async context => {
      const l1Vec = await getSentenceFeatures(lang, tokens, l1Tfidf[context], token2vec, langProvider)
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
): Promise<sdk.MLToolkit.SVM.Prediction[]> => {
  const l0Vec = await getSentenceFeatures(lang, tokens, l0Tfidf, token2vec, langProvider)
  const l0Features = [...l0Vec, tokens.length]
  return await predictL0Contextually(l0Features, includedContexts, l0Model)
}

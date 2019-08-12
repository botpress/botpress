import _ from 'lodash'

import { LanguageProvider, Token2Vec } from '../../typings'
import { MAX_TFIDF, TfidfOutput } from '../intents/tfidf'
import { getClosestToken } from '../language/ft_featurizer'

/** Returns a value between [1, bucketSize] */
export const computeBucket = (bucketSize: number) => (value: number, max: number) =>
  Math.min(bucketSize, Math.max(Math.ceil(bucketSize * (value / max)), 1))

const tierce = computeBucket(3)
const TFIDF_WEIGHTS = ['low', 'medium', 'high']

export const getTFIDFfeature = async (
  tfidf: TfidfOutput,
  token: string,
  languageProvider: LanguageProvider,
  tokenVecCache: Token2Vec,
  language: string
): Promise<string> => {
  let value = tfidf['global'][token]
  if (!value) {
    const [wordVec] = await languageProvider.vectorize([token], language)
    const closestTok = await getClosestToken(token, Array.from(wordVec), tokenVecCache)
    value = tfidf['global'][closestTok]
  }

  const third = tierce(value, MAX_TFIDF)
  return TFIDF_WEIGHTS[third - 1]
}

export const getFeaturesPairs = (vec0: string[], vec1: string[], features: string[]) => {
  const getPrefixAndFeat = (vec: string[], targetFeat: string) =>
    (vec.find(feat => feat.includes(targetFeat)) || '').replace(targetFeat, '').split('=')

  return features
    .map(targetFeat => {
      const [f0Prefix, f0Val] = getPrefixAndFeat(vec0, targetFeat)
      const [f1Prefix, f1Val] = getPrefixAndFeat(vec1, targetFeat)

      if (f0Val && f1Val) {
        return `${f0Prefix}|${f1Prefix}${targetFeat}=${f0Val}|${f1Val}`
      }
    })
    .filter(_.identity)
}

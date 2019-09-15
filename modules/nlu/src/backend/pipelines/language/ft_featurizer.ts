import _ from 'lodash'

import { computeNorm, ndistance, scalarDivide, vectorAdd } from '../../tools/math'
import { levenshtein } from '../../tools/strings'
import { LanguageProvider, Token2Vec } from '../../typings'

const debug = DEBUG('nlu')
  .sub('intents')
  .sub('vocab')

type Token = string
type Document = Token[]

export const enrichToken2Vec = async (
  lang: string,
  doc: Document,
  langProvider: LanguageProvider,
  token2vec: Token2Vec
): Promise<void> => {
  const vecs = await langProvider.vectorize(doc, lang)

  if (Object.isFrozen(token2vec)) {
    throw new Error('Passed Token2Vec must not be frozen')
  }

  _.zip(doc, vecs).forEach(([token, vec]) => {
    if (token && vec && !token2vec[token]) {
      token2vec[token] = Array.from(vec.values())
    }
  })
}

export const getSentenceFeatures = async ({
  lang,
  doc,
  docTfidf,
  langProvider,
  token2vec
}: {
  lang: string
  doc: Document
  docTfidf: _.Dictionary<number>
  token2vec: Token2Vec
  langProvider: LanguageProvider
}): Promise<number[]> => {
  const vecs = (await langProvider.vectorize(doc, lang)).map(x => Array.from(x.values()))

  debug(`get for '${lang}'`, { doc, got: vecs.map(x => x.length) })

  if (!vecs.length) {
    throw new Error(`Could not get sentence vectors (empty result)`)
  }

  return computeSentenceEmbedding(vecs, doc, docTfidf, token2vec)
}

export function getClosestToken(tokenStr: string, tokenVec: number[], token2Vec: Token2Vec): string {
  let token = ''
  let dist = Number.POSITIVE_INFINITY
  _.forEach(token2Vec, (vec, t) => {
    // Leveinshtein is for typo detection (takes precedence over spacial)
    const lev = levenshtein(tokenStr, t)
    if (lev <= 2 && t.length >= 4 && tokenStr.length >= 4 && lev <= dist) {
      dist = lev
      token = t
    }

    // Space (vector) distance is for close-meaning detection
    const d = ndistance(tokenVec, vec)
    if (d <= dist) {
      token = t
      dist = d
    }
  })
  return token
}

// Taken from https://github.com/facebookresearch/fastText/blob/26bcbfc6b288396bd189691768b8c29086c0dab7/src/fasttext.cc#L486s
export function computeSentenceEmbedding(
  wordVectors: number[][],
  doc: Document,
  docTfidf: Dic<number>,
  token2vec: Token2Vec
): number[] {
  const defaultWordWeight = docTfidf['__avg__'] || 1
  let totalWeight = 0
  let sentenceVec = new Array(wordVectors[0].length).fill(0)

  wordVectors.forEach((vec, i) => {
    const norm = computeNorm(vec)
    if (norm > 0) {
      const token = doc[i]
      const outOfVocab = typeof docTfidf[token] === 'undefined'
      let weight = docTfidf[token]

      if (outOfVocab) {
        const closerToken = getClosestToken(token, vec, token2vec)
        weight = docTfidf[closerToken] || defaultWordWeight
      }

      totalWeight += weight
      const weightedVec = scalarDivide(vec, norm / weight)
      sentenceVec = vectorAdd(sentenceVec, weightedVec)
    }
  })

  return scalarDivide(sentenceVec, totalWeight)
}

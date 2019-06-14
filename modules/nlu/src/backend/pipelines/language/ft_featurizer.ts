import _ from 'lodash'

import { LanguageProvider } from '../../typings'

const debug = DEBUG('nlu')
  .sub('intents')
  .sub('vocab')

type Token = string
type Document = Token[]

export const getSentenceFeatures = async (
  lang: string,
  doc: Document,
  docTfidf: _.Dictionary<number>,
  langProvider: LanguageProvider
): Promise<number[]> => {
  const vecs = await langProvider.vectorize(doc, lang)

  debug(`get for '${lang}'`, { doc, gotten: vecs.map(x => x.length) })

  if (!vecs.length) {
    throw new Error(`Could not get sentence vectors (empty result)`)
  }

  return computeSentenceEmbedding(vecs, doc, docTfidf)
}

// Taken from https://github.com/facebookresearch/fastText/blob/26bcbfc6b288396bd189691768b8c29086c0dab7/src/fasttext.cc#L486s
export function computeSentenceEmbedding(wordVectors: number[][], doc: Document, docTfidf: Dic<number>): number[] {
  const defaultWordWeight = docTfidf['__avg__'] || 1
  let totalWeight = 0
  let sentenceVec = new Array(wordVectors[0].length).fill(0)

  wordVectors.forEach((vec, i) => {
    const norm = computeNorm(vec)
    if (norm > 0) {
      const weight = docTfidf[doc[i]] || defaultWordWeight
      totalWeight += weight
      const weightedVec = scalarDivide(vec, norm / weight)
      sentenceVec = vecAdd(sentenceVec, weightedVec)
    }
  })

  return scalarDivide(sentenceVec, totalWeight)
}

function computeNorm(vec: number[]): number {
  return Math.sqrt(vec.reduce((acc, next) => acc + Math.pow(next, 2), 0))
}

function vecAdd(vec1: number[], vec2: number[]): number[] {
  return _.zip(vec1, vec2).map(([x, y]) => x + y)
}

function scalarDivide(vec: number[], divider: number): number[] {
  return vec.map(x => x / divider)
}

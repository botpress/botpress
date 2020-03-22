import _ from 'lodash'

import { computeNorm, scalarDivide, vectorAdd, zeroes } from '../tools/math'
import Utterance, { UtteranceToken } from '../utterance/utterance'

function shouldConsiterToken(token: UtteranceToken): boolean {
  const isSysOrPatternEntity = token.entities.some(
    en => en.metadata.extractor === 'pattern' || en.metadata.extractor === 'system'
  )
  return token.isWord && !isSysOrPatternEntity
}

export function getSentenceEmbeddingForCtx(utt: Utterance): number[] {
  const toks = utt.tokens.filter(shouldConsiterToken)
  if (_.isEmpty(toks)) {
    return zeroes(utt.tokens[0].vector.length)
  }

  const totalWeight = toks.reduce((sum, t) => sum + Math.min(1, t.tfidf), 0) || 1
  const weightedSum = toks.reduce((sum, t) => {
    const norm = computeNorm(<number[]>t.vector)
    const weightedVec = scalarDivide(<number[]>t.vector, norm / Math.min(1, t.tfidf))
    return vectorAdd(sum, weightedVec)
  }, zeroes(utt.tokens[0].vector.length))

  return scalarDivide(weightedSum, totalWeight)
}

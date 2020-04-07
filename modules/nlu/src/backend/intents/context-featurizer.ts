import _ from 'lodash'

import { DucklingEntityExtractor } from '../entities/duckling_extractor'
import { computeNorm, scalarDivide, vectorAdd, zeroes } from '../tools/math'
import Utterance, { UtteranceToken } from '../utterance/utterance'

function shouldConsiderToken(token: UtteranceToken): boolean {
  const isSysOrPatternEntity = token.entities.some(
    en => en.metadata.extractor === 'pattern' || en.metadata.extractor === 'system'
  )
  return token.isWord && !isSysOrPatternEntity
}

function getEntitiesEncoding(utt: Utterance, customEntities: string[]): number[] {
  const allEntities = [...customEntities, ...DucklingEntityExtractor.entityTypes]
  const entityMap: _.Dictionary<number> = allEntities.reduce((map, next) => ({ ...map, [next]: 0 }), {})
  utt.entities.forEach(e => entityMap[e.type]++)
  return _.chain(entityMap)
    .toPairs()
    .orderBy('0')
    .map(([key, val]) => val)
    .value()
}

export function getCtxFeatures(utt: Utterance, customEntities: string[]): number[] {
  const toks = utt.tokens.filter(shouldConsiderToken)
  if (_.isEmpty(toks)) {
    return zeroes(utt.tokens[0].vector.length)
  }

  const totalWeight = toks.reduce((sum, t) => sum + Math.min(1, t.tfidf), 0) || 1
  const weightedSum = toks.reduce((sum, t) => {
    const norm = computeNorm(<number[]>t.vector)
    const weightedVec = scalarDivide(<number[]>t.vector, norm / Math.min(1, t.tfidf))
    return vectorAdd(sum, weightedVec)
  }, zeroes(utt.tokens[0].vector.length))

  const entitiesOH = getEntitiesEncoding(utt, customEntities)
  const sentenceEmbedding = scalarDivide(weightedSum, totalWeight)
  return [...sentenceEmbedding, ...entitiesOH]
}

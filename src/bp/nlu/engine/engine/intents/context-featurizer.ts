import _ from 'lodash'

import { zeroes } from '../tools/math'
import Utterance, { UtteranceToken } from '../utterance/utterance'

import { getEntitiesEncoding } from './entities-featurizer'

function shouldConsiderToken(token: UtteranceToken): boolean {
  const isSysOrPatternEntity = token.entities.some(
    en => en.metadata.extractor === 'pattern' || en.metadata.extractor === 'system'
  )
  return token.isWord && !isSysOrPatternEntity
}

export function getCtxFeatures(utt: Utterance, customEntities: string[]): number[] {
  const entitiesOH = getEntitiesEncoding(utt, customEntities)
  const toks = utt.tokens.filter(shouldConsiderToken)
  if (_.isEmpty(toks)) {
    return zeroes(utt.tokens[0].vector.length + entitiesOH.length)
  }

  /**
   * TODO:
   * - should maybe use a topic computed tfidf (tfid is computed on intents)
   * - why do we even filter out patterns and systems ?
   */
  const sentenceEmbedding = utt.sentenceEmbedding({ keepToken: shouldConsiderToken })
  return [...sentenceEmbedding, ...entitiesOH]
}

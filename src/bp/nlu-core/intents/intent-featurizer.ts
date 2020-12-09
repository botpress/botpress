import _ from 'lodash'

import Utterance from '../utterance/utterance'

import { getEntitiesEncoding } from './entities-featurizer'

export function getIntentFeatures(utt: Utterance, customEntities: string[]): number[] {
  const entitiesOH = getEntitiesEncoding(utt, customEntities)
  return [...utt.sentenceEmbedding(), utt.tokens.length, ...entitiesOH]
}

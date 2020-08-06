import _ from 'lodash'

import Utterance from '../utterance/utterance'

export function getIntentFeatures(utt: Utterance, customEntities: string[]): number[] {
  return [...utt.sentenceEmbedding, utt.tokens.length]
}

import _ from 'lodash'

import Utterance from '../utterance/utterance'

function getEntitiesEncoding(utt: Utterance, customEntities: string[]): number[] {
  const entityMap: _.Dictionary<number> = customEntities.reduce((map, next) => ({ ...map, [next]: 0 }), {})
  utt.entities.forEach(e => entityMap[e.type]++)
  return _.chain(entityMap)
    .toPairs()
    .orderBy('0')
    .map(([key, val]) => val)
    .value()
}

export function getIntentFeatures(utt: Utterance, customEntities: string[]): number[] {
  const entitiesOH = getEntitiesEncoding(utt, customEntities)
  return [...utt.sentenceEmbedding, utt.tokens.length, ...entitiesOH]
}

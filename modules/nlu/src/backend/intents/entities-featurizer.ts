import _ from 'lodash'

import Utterance from '../utterance/utterance'

export function getEntitiesEncoding(utt: Utterance, customEntities: string[]): number[] {
  const zeros = Array(customEntities.length).fill(0)
  let entityMap: _.Dictionary<number> = _.zipObject(customEntities, zeros)

  const entitiesOccurence = _.countBy(utt.entities.map(e => e.type))
  entityMap = { ...entityMap, ...entitiesOccurence }

  return _.chain(entityMap)
    .toPairs()
    .orderBy('0')
    .map(([key, val]) => val)
    .value()
}

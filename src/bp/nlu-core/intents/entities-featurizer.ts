import _ from 'lodash'

import Utterance from '../utterance/utterance'

export function getEntitiesEncoding(utt: Utterance, customEntities: string[]): number[] {
  const zeros = Array(customEntities.length).fill(0)
  let entityMap: _.Dictionary<number> = _.zipObject(customEntities, zeros)

  const entitiesOccurence = _(utt.entities)
    .filter(e => e.metadata.extractor !== 'system')
    .map(e => e.type)
    .countBy()
    .value()

  entityMap = { ...entityMap, ...entitiesOccurence }

  return _.chain(entityMap)
    .toPairs()
    .orderBy('0')
    .map(([key, val]) => val)
    .value()
}

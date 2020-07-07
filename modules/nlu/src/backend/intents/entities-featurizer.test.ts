import _ from 'lodash'

import { UtteranceEntity, UtteranceRange, makeTestUtterance } from '../utterance/utterance'

import { getEntitiesEncoding } from './entities-featurizer'

type Entity = UtteranceRange & UtteranceEntity
function buildEntity(type: string): Entity {
  return {
    confidence: 0,
    endPos: 0,
    endTokenIdx: 0,
    metadata: {
      entityId: 'The Mordor',
      extractor: 'list',
      source: 'Bilbo baggins'
    },
    startPos: 0,
    startTokenIdx: 0,
    type,
    value: 'frodo the hobbit',
    sensitive: false
  }
}

describe('Entities featurizer', () => {
  test('All entities should be represented in features even the ones with no occurences', () => {
    // Arrange
    const definitions = ['Tata', 'Toto', 'Tutu', 'Titi']

    const utt = makeTestUtterance(
      '"Fool of a Took! Throw yourself in next time, and rid us of your stupidity" - Gandalf'
    )
    utt.entities = [
      buildEntity('Tutu'),
      buildEntity('Tutu'),
      buildEntity('Tutu'),
      buildEntity('Tutu'),
      buildEntity('Tutu'),
      buildEntity('Titi')
    ]

    // Act
    const actual = getEntitiesEncoding(utt, definitions)

    // Assert
    const expected = [0, 1, 0, 5]
    expect(actual.length).toBe(expected.length)
    for (const x of _.zip(actual, expected)) {
      const [act, ex] = x
      expect(act).toBe(ex)
    }
  })
})

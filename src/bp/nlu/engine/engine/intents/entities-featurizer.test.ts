import _ from 'lodash'
import { makeTestUtterance } from '../test-utils/fake-utterance'

import { UtteranceEntity, UtteranceRange } from '../utterance/utterance'

import { getEntitiesEncoding } from './entities-featurizer'

type Entity = UtteranceRange & UtteranceEntity
type ExtractorType = 'system' | 'list' | 'pattern'
function buildEntity(type: string, extractor: ExtractorType = 'list'): Entity {
  return {
    confidence: 0,
    endPos: 0,
    endTokenIdx: 0,
    metadata: {
      entityId: 'The Mordor',
      extractor,
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

  test('System entities should not be counted in features', () => {
    // Arrange
    const definitions = ['Tata', 'Toto', 'Tutu', 'Titi']

    const utt = makeTestUtterance(
      '"Fool of a Took! Throw yourself in next time, and rid us of your stupidity" - Gandalf'
    )
    utt.entities = [
      buildEntity('Tutu'),
      buildEntity('Tutu', 'system'),
      buildEntity('Toto', 'system'),
      buildEntity('Tutu'),
      buildEntity('Toto'),
      buildEntity('Titi')
    ]

    // Act
    const actual = getEntitiesEncoding(utt, definitions)

    // Assert
    const expected = [0, 1, 1, 2]
    expect(actual.length).toBe(expected.length)
    for (const x of _.zip(actual, expected)) {
      const [act, ex] = x
      expect(act).toBe(ex)
    }
  })
})

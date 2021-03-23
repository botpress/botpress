import _ from 'lodash'

import { OOSIntentClassifier } from './oos-intent-classfier'
import { NoneableIntentPredictions } from './intent-classifier'

test('remove none intent', () => {
  // arrange
  const preds: NoneableIntentPredictions = {
    oos: 0.666,
    intents: [
      { name: 'A', confidence: 0.58, extractor: 'classifier' },
      { name: 'none', confidence: 0.42, extractor: 'classifier' }
    ]
  }

  // act
  const withoutNone = OOSIntentClassifier._removeNoneIntent(preds)

  // assert
  const expectedGlobalOOS = 0.666 / (0.666 + 0.58) // 0.53
  expect(withoutNone.oos).toBe(expectedGlobalOOS)

  const totalGlobalConf = withoutNone.oos + _.sum(withoutNone.intents.map(i => i.confidence))
  expect(totalGlobalConf).toBe(1)
  expect(withoutNone.intents.some(i => i.name === 'none')).toBe(false)

  expect(withoutNone.oos).toBe(0.99)
  const totalSomeTopicConf = withoutNone.oos + _.sum(withoutNone.intents.map(i => i.confidence))
  expect(totalSomeTopicConf).toBe(1)
  expect(withoutNone.intents.some(i => i.name === 'none')).toBe(false)
})

test('ajdust to 100', () => {
  // arrange
  const nlu: NoneableIntentPredictions = {
    oos: 0.99,
    intents: [
      { name: 'A', confidence: 0.98, extractor: 'classifier' },
      { name: 'none', confidence: 0.02, extractor: 'classifier' }
    ]
  }

  // act
  const withoutNone = OOSIntentClassifier._removeNoneIntent(nlu)

  // assert
  const expectedOOS = 0.99 / (0.99 + 0.98) // 0.503
  expect(withoutNone.oos).toBe(expectedOOS)
  expect(withoutNone.intents.some(i => i.name === 'none')).toBe(false)
})

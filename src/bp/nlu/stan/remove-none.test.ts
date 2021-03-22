import _ from 'lodash'

import { BpPredictOutput } from './api-mapper'
import removeNoneIntent from './remove-none'

test('remove none intent', () => {
  // arrange
  const nlu: BpPredictOutput = {
    entities: [],
    contexts: {
      global: {
        confidence: 0.5,
        oos: 0.666,
        intents: [
          { label: 'A', confidence: 0.58, extractor: 'classifier', slots: {} },
          { label: 'none', confidence: 0.42, extractor: 'classifier', slots: {} }
        ]
      },
      someTopic: {
        confidence: 0.5,
        oos: 0.123,
        intents: [
          { label: 'B', confidence: 0.01, extractor: 'classifier', slots: {} },
          { label: 'none', confidence: 0.99, extractor: 'classifier', slots: {} }
        ]
      }
    },
    detectedLanguage: 'en',
    spellChecked: 'heyheyheyhey',
    utterance: 'heyheyheyhey'
  }

  // act
  const withoutNone = removeNoneIntent(nlu)

  // assert
  const expectedGlobalOOS = 0.666 / (0.666 + 0.58) // 0.53
  expect(withoutNone.contexts.global.oos).toBe(expectedGlobalOOS)

  const totalGlobalConf =
    withoutNone.contexts.global.oos + _.sum(withoutNone.contexts.global.intents.map(i => i.confidence))
  expect(totalGlobalConf).toBe(1)
  expect(withoutNone.contexts.global.intents.some(i => i.label === 'none')).toBe(false)

  expect(withoutNone.contexts.someTopic.oos).toBe(0.99)
  const totalSomeTopicConf =
    withoutNone.contexts.someTopic.oos + _.sum(withoutNone.contexts.someTopic.intents.map(i => i.confidence))
  expect(totalSomeTopicConf).toBe(1)
  expect(withoutNone.contexts.someTopic.intents.some(i => i.label === 'none')).toBe(false)
})

test('ajdust to 100', () => {
  // arrange
  const nlu: BpPredictOutput = {
    entities: [],
    contexts: {
      global: {
        confidence: 1.0,
        oos: 0.99,
        intents: [
          { label: 'A', confidence: 0.98, extractor: 'classifier', slots: {} },
          { label: 'none', confidence: 0.02, extractor: 'classifier', slots: {} }
        ]
      }
    },
    detectedLanguage: 'en',
    spellChecked: 'heyheyheyhey',
    utterance: 'heyheyheyhey'
  }

  // act
  const withoutNone = removeNoneIntent(nlu)

  // assert
  const expectedOOS = 0.99 / (0.99 + 0.98) // 0.503
  expect(withoutNone.contexts.global.oos).toBe(expectedOOS)
  expect(withoutNone.contexts.global.intents.some(i => i.label === 'none')).toBe(false)
})

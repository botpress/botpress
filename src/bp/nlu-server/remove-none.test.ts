import { NLU } from 'botpress/sdk'

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
          { label: 'A', confidence: 0.5, extractor: 'classifier', slots: {} },
          { label: 'none', confidence: 0.42, extractor: 'classifier', slots: {} }
        ]
      },
      someTopic: {
        confidence: 0.5,
        oos: 0.123,
        intents: [
          { label: 'B', confidence: 0.5, extractor: 'classifier', slots: {} },
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
  expect(withoutNone.contexts.global.oos).toBe(0.666)
  expect(withoutNone.contexts.someTopic.oos).toBe(0.99)
  expect(withoutNone.contexts.global.intents.some(i => i.label === 'none')).toBe(false)
  expect(withoutNone.contexts.someTopic.intents.some(i => i.label === 'none')).toBe(false)
})

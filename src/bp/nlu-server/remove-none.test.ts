import { NLU } from 'botpress/sdk'

import removeNoneIntent from './remove-none'

test('remove none intent', () => {
  // arrange
  const nlu: NLU.PredictOutput = {
    entities: [],
    predictions: {
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
    }
  }

  // act
  const withoutNone = removeNoneIntent(nlu)

  // assert
  expect(withoutNone.predictions.global.oos).toBe(0.666)
  expect(withoutNone.predictions.someTopic.oos).toBe(0.99)
  expect(withoutNone.predictions.global.intents.some(i => i.label === 'none')).toBe(false)
  expect(withoutNone.predictions.someTopic.intents.some(i => i.label === 'none')).toBe(false)
})

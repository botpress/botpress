import { ContextPrediction, IntentPrediction } from '@botpress/nlu-client'
import { isContextPrediction, isIntentPrediction, ContextPredictionExtended } from './utils'

describe('utils', () => {
  describe('isContextPrediction', () => {
    it('should return true is input confirms to original implementation of ContextPrediction', () => {
      const fakeContextPrediction = mockContextPrediction()
      expect(isContextPrediction(fakeContextPrediction)).toStrictEqual(true)
    })
    it('should return true is input confirms to re-implementation of ContextPrediction: EventUnderstanding', () => {
      /**
       * unfortunately this test is necessary because EventUnderstanding interface from `/packages/bp/src/sdk/botpress.d.ts`
       *  diverged from the original type: ContextPrediction
       */
      const fakeContextPrediction = {
        confidence: 1,
        intents: [],
        label: 'label',
        oos: 1
      }
      expect(isContextPrediction(fakeContextPrediction)).toStrictEqual(true)
    })
    it('should not find any values that conform to the ContextPrediction with the given list', () => {
      const maybeContextPredictions = [
        { hello: 'world' },
        null,
        undefined,
        true,
        false,
        0,
        -0,
        1,
        -1,
        Infinity,
        NaN,
        [],
        {},
        new Map(),
        new Set(),
        new Date()
      ]
      expect(maybeContextPredictions.find(cp => isContextPrediction(cp))).toStrictEqual(undefined)
    })
  })

  describe('isIntentPrediction', () => {
    it('should return true is input confirms to original implementation of IntentPrediction', () => {
      const fakeIntentPrediction = mockIntentPrediction()
      expect(isIntentPrediction(fakeIntentPrediction)).toStrictEqual(true)
    })
    it('should return true is input confirms to re-implementation of IntentPrediction: EventUnderstanding', () => {
      /**
       * unfortunately this test is necessary because EventUnderstanding interface from `/packages/bp/src/sdk/botpress.d.ts`
       *  diverged from the original type: IntentPrediction
       */
      const fakeIntentPrediction = {
        confidence: 1,
        extractor: 'extractor',
        label: 'label',
        slots: []
      }
      expect(isIntentPrediction(fakeIntentPrediction)).toStrictEqual(true)
    })
    it('should not find any values that conform to the IntentPrediction with the given list', () => {
      const maybeContextPredictions = [
        { hello: 'world' },
        null,
        undefined,
        true,
        false,
        0,
        -0,
        1,
        -1,
        Infinity,
        NaN,
        [],
        {},
        new Map(),
        new Set(),
        new Date()
      ]
      expect(maybeContextPredictions.find(cp => isIntentPrediction(cp))).toStrictEqual(undefined)
    })
  })
})

function mockContextPrediction(contextPrediction?: Partial<ContextPrediction>): ContextPredictionExtended {
  return {
    confidence: 1,
    intents: [],
    oos: 1,
    ...contextPrediction
  }
}

function mockIntentPrediction(intentPrediction?: Partial<IntentPrediction>): IntentPrediction {
  return {
    confidence: 1,
    extractor: 'extractor',
    name: 'name',
    slots: [],
    ...intentPrediction
  }
}

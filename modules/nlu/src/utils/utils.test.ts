import { ContextPrediction, IntentPrediction } from '@botpress/nlu-client'
import { isNotNil, isRecord, isContextPrediction, isIntentPrediction, ContextPredictionExtended } from './utils'

describe('utils', () => {
  describe('isNotNil', () => {
    it('should not find values that are undefined or null', () => {
      const results = [
        true,
        false,
        {},
        [],
        0,
        1,
        -0,
        -1,
        '',
        'string',
        new Date(),
        Date.now(),
        Infinity,
        NaN,
        new Map(),
        new Set()
      ]
      expect(results.find(r => !isNotNil(r))).toStrictEqual(undefined)
    })
    it("should not find values that aren't undefined or null", () => {
      const results = [undefined, null]
      expect(results.find(r => isNotNil(r))).toStrictEqual(undefined)
    })
  })

  describe('isRecord', () => {
    it('should not find values that are an object-like record', () => {
      const result = [[], null, undefined, false, true, 0, -0, 1, -1, '', 'string', Date.now(), Infinity, NaN]
      expect(result.find(r => isRecord(r))).toStrictEqual(undefined)
    })
    it("should not find values that aren't an object-like record", () => {
      const result = [{}, new Date(), new Map(), new Set()]
      expect(result.find(r => !isRecord(r))).toStrictEqual(undefined)
    })
  })

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

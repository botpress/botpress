import { extractElectedIntentSlot } from './natural-election'
import { mockEventUnderstanding } from '../../test/mocks'

describe('naturalElection', () => {
  describe('extractElectedIntentSlot', () => {
    it("should return input directly if the 'predictions' property is nil", () => {
      const input = mockEventUnderstanding({ predictions: undefined })
      const result = extractElectedIntentSlot(input)
      expect(result).toStrictEqual(input)
    })

    it("should return input directly if the 'intent' property is nil", () => {
      const input = mockEventUnderstanding({ predictions: {}, intent: undefined })
      const result = extractElectedIntentSlot(input)
      expect(result).toStrictEqual(input)
    })

    it("should return input directly if the 'context' property of the 'predictions' property is nil", () => {
      const input = mockEventUnderstanding({ predictions: { context: undefined }, intent: {} })
      const result = extractElectedIntentSlot(input)
      expect(result).toStrictEqual(input)
    })

    it("should return input directly if the 'intents' property of the prediction 'context' property is nil", () => {
      const input = mockEventUnderstanding({ predictions: { context: { intents: undefined } }, intent: {} })
      const result = extractElectedIntentSlot(input)
      expect(result).toStrictEqual(input)
    })

    it("should return input with an empty 'slots' object if no labels within the 'intents' array match the 'intent' name", () => {
      const input = mockEventUnderstanding({
        predictions: { context: { intents: [{ label: 'name', confidence: 1, extractor: 'extractor', slots: [] }] } },
        intent: { name: 'label' }
      })
      const result = extractElectedIntentSlot(input)
      expect(result).toStrictEqual({ ...input, slots: {} })
    })

    it("should return input with the 'slots' object filled with that of the elected intent if a label within the 'intents' array matches the 'intent' name", () => {
      const input = mockEventUnderstanding({
        predictions: { context: { intents: [{ label: 'name', confidence: 1, extractor: 'extractor', slots: [] }] } },
        intent: { name: 'name' }
      })
      const result = extractElectedIntentSlot(input)
      expect(result).toStrictEqual({ ...input, slots: {} })
    })
  })
})

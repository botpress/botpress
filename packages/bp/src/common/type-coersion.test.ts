import { isNotNil, isRecord } from './type-coersion'

describe('type-coersion', () => {
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
})

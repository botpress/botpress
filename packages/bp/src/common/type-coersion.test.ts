import { isNil } from './type-coersion'

describe('type-coersion', () => {
  describe('isNil', () => {
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
      expect(results.filter(isNil).length).toStrictEqual(0)
    })
    it('should find values that are undefined or null', () => {
      const results = [undefined, null]
      expect(results.filter(isNil).length).toStrictEqual(2)
    })
  })
})

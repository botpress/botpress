import { describe, it, expect } from 'vitest'
import { parseNumber } from './parseNumber'

describe('parseNumber', () => {
  it('should accept errorMessage', () => {
    expect(
      parseNumber({
        type: 'number',
        format: 'int64',
        exclusiveMinimum: 0,
        maximum: 2,
        multipleOf: 2,
        errorMessage: {
          format: 'ayy',
          multipleOf: 'lmao',
          exclusiveMinimum: 'deez',
          maximum: 'nuts',
        },
      }),
    ).toStrictEqual('z.number().int("ayy").multipleOf(2, "lmao").gt(0, "deez").lte(2, "nuts")')
  })
})

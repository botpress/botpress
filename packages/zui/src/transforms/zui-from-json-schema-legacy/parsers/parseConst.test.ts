import { describe, it, expect } from 'vitest'
import { parseConst } from './parseConst'

describe('parseConst', () => {
  it('should handle falsy constants', () => {
    expect(
      parseConst({
        const: false,
      }),
    ).toStrictEqual('z.literal(false)')
  })
})

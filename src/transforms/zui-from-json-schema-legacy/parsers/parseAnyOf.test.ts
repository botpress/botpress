import { describe, it, expect } from 'vitest'
import { parseAnyOf } from './parseAnyOf'

describe('parseAnyOf', () => {
  it('should create a union from two or more schemas', () => {
    expect(
      parseAnyOf(
        {
          anyOf: [
            {
              type: 'string',
            },
            { type: 'number' },
          ],
        },
        { path: [], seen: new Map() },
      ),
    ).toStrictEqual('z.union([z.string(), z.number()])')
  })

  it('should extract a single schema', () => {
    expect(parseAnyOf({ anyOf: [{ type: 'string' }] }, { path: [], seen: new Map() })).toStrictEqual('z.string()')
  })

  it('should return z.any() if array is empty', () => {
    expect(parseAnyOf({ anyOf: [] }, { path: [], seen: new Map() })).toStrictEqual('z.any()')
  })
})

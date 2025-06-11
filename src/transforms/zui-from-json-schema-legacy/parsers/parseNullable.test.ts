import { describe, it, expect } from 'vitest'
import { parseSchema } from './parseSchema'

describe('parseNullable', () => {
  it('parseSchema should not add default twice', () => {
    expect(
      parseSchema(
        {
          type: 'string',
          nullable: true,
          default: null,
        },
        { path: [], seen: new Map() },
      ),
    ).toStrictEqual('z.string().nullable().default(null)')
  })
})

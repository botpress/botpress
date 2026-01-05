import { describe, it, expect } from 'vitest'
import { parseNot } from './parseNot'

describe('parseNot', () => {
  it('Not a string', () => {
    expect(
      parseNot(
        {
          not: {
            type: 'string',
          },
        },
        { path: [], seen: new Map() },
      ),
    ).toStrictEqual(
      'z.any().refine((value) => !z.string().safeParse(value).success, "Invalid input: Should NOT be valid against schema")',
    )
  })
})

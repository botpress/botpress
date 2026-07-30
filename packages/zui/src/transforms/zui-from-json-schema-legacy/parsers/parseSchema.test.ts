import { describe, it, expect } from 'vitest'
import { parseSchema } from './parseSchema.js'

describe('parseSchema', () => {
  it('should be usable without providing refs', () => {
    expect(parseSchema({ type: 'string' })).toStrictEqual('z.string()')
  })
})

import { describe, expect, it } from 'vitest'
import { getReasoningHint } from './reasoning.js'

describe('reasoning hint', () => {
  it('supplements explicit reasoning disablement', () => {
    expect(getReasoningHint('none')).toBe('/no_think')
  })

  it.each([undefined, 'low', 'medium', 'high', 'dynamic'])('preserves reasoning setting %s', (effort) => {
    expect(getReasoningHint(effort)).toBeUndefined()
  })
})

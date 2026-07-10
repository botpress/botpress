import { describe, expect, it } from 'vitest'
import { needsRefresh } from './client'

const NOW = 1_000_000_000_000

describe('needsRefresh', () => {
  it('never refreshes non-expiring tokens (no refreshToken/expiresAt)', () => {
    expect(needsRefresh(undefined, undefined, NOW)).toBe(false)
    expect(needsRefresh('rt', undefined, NOW)).toBe(false)
    expect(needsRefresh(undefined, NOW + 10_000, NOW)).toBe(false)
  })

  it('does not refresh a token still comfortably valid', () => {
    expect(needsRefresh('rt', NOW + 5 * 60_000, NOW)).toBe(false)
  })

  it('refreshes within the 60s buffer of expiry', () => {
    expect(needsRefresh('rt', NOW + 30_000, NOW)).toBe(true)
    expect(needsRefresh('rt', NOW - 1, NOW)).toBe(true)
  })
})

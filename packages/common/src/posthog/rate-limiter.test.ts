import { describe, expect, test, beforeEach } from 'vitest'
import { PostHogRateLimiter } from './rate-limiter'

describe('PostHogRateLimiter', () => {
  let rateLimiter: PostHogRateLimiter

  beforeEach(() => {
    rateLimiter = new PostHogRateLimiter(5, 1000)
  })

  test('should allow events within the limit', () => {
    const key = 'test-key'

    expect(rateLimiter.shouldAllow(key)).toBe(true)
    expect(rateLimiter.shouldAllow(key)).toBe(true)
    expect(rateLimiter.shouldAllow(key)).toBe(true)
    expect(rateLimiter.shouldAllow(key)).toBe(true)
    expect(rateLimiter.shouldAllow(key)).toBe(true)
  })

  test('should reject events exceeding the limit', () => {
    const key = 'test-key'

    for (let i = 0; i < 5; i++) {
      expect(rateLimiter.shouldAllow(key)).toBe(true)
    }

    expect(rateLimiter.shouldAllow(key)).toBe(false)
    expect(rateLimiter.shouldAllow(key)).toBe(false)
  })

  test('should track suppressed count correctly', () => {
    const key = 'test-key'

    for (let i = 0; i < 5; i++) {
      rateLimiter.shouldAllow(key)
    }

    rateLimiter.shouldAllow(key)
    rateLimiter.shouldAllow(key)
    rateLimiter.shouldAllow(key)

    expect(rateLimiter.getSuppressedCount(key)).toBe(3)
  })

  test('should reset window after time expires', async () => {
    const key = 'test-key'

    for (let i = 0; i < 5; i++) {
      rateLimiter.shouldAllow(key)
    }

    expect(rateLimiter.shouldAllow(key)).toBe(false)

    await new Promise((resolve) => setTimeout(resolve, 1100))

    expect(rateLimiter.shouldAllow(key)).toBe(true)
    expect(rateLimiter.getSuppressedCount(key)).toBe(0)
  })

  test('should isolate different keys', () => {
    const key1 = 'key1'
    const key2 = 'key2'

    for (let i = 0; i < 5; i++) {
      rateLimiter.shouldAllow(key1)
    }

    expect(rateLimiter.shouldAllow(key1)).toBe(false)
    expect(rateLimiter.shouldAllow(key2)).toBe(true)
    expect(rateLimiter.shouldAllow(key2)).toBe(true)
  })

  test('should return correct window start', () => {
    const key = 'test-key'

    rateLimiter.shouldAllow(key)
    const windowStart = rateLimiter.getWindowStart(key)

    expect(windowStart).toBeGreaterThan(0)
    expect(windowStart).toBeLessThanOrEqual(Date.now())
  })

  test('should cleanup old windows', () => {
    const key = 'test-key'

    rateLimiter.shouldAllow(key)
    const oldWindow = { count: 10, windowStart: Date.now() - 5000 }
    ;(rateLimiter as any)._limits.set(key, oldWindow)

    rateLimiter.cleanup()

    expect(rateLimiter.shouldAllow(key)).toBe(true)
  })
})

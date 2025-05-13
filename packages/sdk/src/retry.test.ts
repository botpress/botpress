import { describe, it, expect } from 'vitest'
import { retryConfig } from './retry'

const retryDelay = retryConfig.retryDelay!

describe.concurrent('retryConfig', () => {
  it.each([
    {
      headers: {
        'RateLimit-Reset': '300',
      },
      expectedDelay: 300_000,
    },
    {
      headers: {
        'ratelimit-reset': '300',
      },
      expectedDelay: 300_000,
    },
    {
      headers: {
        'X-RateLimit-Reset': '300',
      },
      expectedDelay: 300_000,
    },
    {
      headers: {
        'x-ratelimit-reset': '300',
      },
      expectedDelay: 300_000,
    },
    {
      headers: {
        'Retry-After': '300',
      },
      expectedDelay: 300_000,
    },
    {
      headers: {
        'retry-after': '300',
      },
      expectedDelay: 300_000,
    },
  ])('should evaluate $headers to $expectedDelay ms', ({ headers, expectedDelay }) => {
    // Arrange
    const axiosError = { response: { headers } } as any

    // Act
    const result = retryDelay(1, axiosError)

    // Assert
    expect(result).toEqual(expectedDelay)
  })

  it('should evaluate a date string to the correct delay', () => {
    // Arrange
    const delay_seconds = 300
    const delay_ms = delay_seconds * 1000
    const futureDate = new Date(Date.now() + delay_ms)
    const axiosError = { response: { headers: { 'Retry-After': futureDate.toString() } } } as any

    // Act
    const result = retryDelay(1, axiosError)

    // Assert
    const jitter = 1000 // 1 second of jitter
    expect(result).toBeGreaterThanOrEqual(delay_ms - jitter)
    expect(result).toBeLessThanOrEqual(delay_ms + jitter)
  })

  it.each([
    { retryCount: 1, expectedDelay: 1000 },
    { retryCount: 2, expectedDelay: 2000 },
    { retryCount: 3, expectedDelay: 3000 },
  ])('should evaluate no headers with $retryCount retries to $expectedDelay ms', ({ retryCount, expectedDelay }) => {
    // Arrange
    const axiosError = { response: { headers: {} } } as any

    // Act
    const result = retryDelay(retryCount, axiosError)

    // Assert
    expect(result).toEqual(expectedDelay)
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { debounceAsync } from './concurrency-utils'

const TIMEOUT_MS = 100

describe('debounceAsync', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(async () => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('should not execute function before delay', async () => {
    // Arrange
    const fn = vi.fn().mockResolvedValue('result')
    const debouncedFn = debounceAsync(fn, TIMEOUT_MS)

    // Act
    debouncedFn('a')
    await vi.advanceTimersByTimeAsync(TIMEOUT_MS - 1)

    // Assert
    expect(fn).not.toHaveBeenCalled()
  })

  it('should execute function only once after delay', async () => {
    // Arrange
    const fn = vi.fn().mockResolvedValue('result')
    const debouncedFn = debounceAsync(fn, TIMEOUT_MS)

    // Act
    debouncedFn('a')
    debouncedFn('b')
    await vi.advanceTimersByTimeAsync(TIMEOUT_MS - 1)
    debouncedFn('c')
    await vi.advanceTimersByTimeAsync(TIMEOUT_MS)

    // Assert
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('c')
  })

  it('should preserve `this` context', async () => {
    // Arrange
    const context = { value: 42 }
    const fn = vi.fn(function (this: typeof context) {
      return Promise.resolve(this.value)
    })
    const debouncedFn = debounceAsync(fn, TIMEOUT_MS)

    // Act
    const promise = debouncedFn.call(context)

    await vi.advanceTimersByTimeAsync(TIMEOUT_MS)

    // Assert
    await expect(promise).resolves.toBe(42)
  })

  it('should handle rejections', async () => {
    // Arrange
    const error = new Error('test rejection')
    const fn = vi.fn().mockRejectedValue(error)
    const debouncedFn = debounceAsync(fn, 1)
    vi.useRealTimers()

    // Act & Assert
    await expect(debouncedFn).rejects.toThrow(error)
  })
})

import { test, expect, vi } from 'vitest'
import { repeat } from './repeat'

test('repeat calls the function the specified number of times', async () => {
  const callback = vi
    .fn()
    .mockResolvedValueOnce({ repeat: true, result: 1 })
    .mockResolvedValueOnce({ repeat: true, result: 2 })
    .mockResolvedValueOnce({ repeat: false, result: 3 })

  const backoff = vi.fn().mockReturnValue(0)

  const result = await repeat<number>(callback, { maxIterations: 5, backoff })

  expect(result).toBe(3)
  expect(callback).toHaveBeenCalledTimes(3)
  expect(backoff).toHaveBeenCalledTimes(2)
  expect(backoff).toHaveBeenNthCalledWith(1, 1, 1)
  expect(backoff).toHaveBeenNthCalledWith(2, 2, 2)
})

test('repeat stops after maxIterations', async () => {
  const callback = vi
    .fn()
    .mockResolvedValueOnce({ repeat: true, result: 1 })
    .mockResolvedValueOnce({ repeat: true, result: 2 })
    .mockResolvedValueOnce({ repeat: false, result: 3 })

  const backoff = vi.fn().mockReturnValue(0)

  const result = await repeat<number>(callback, { maxIterations: 2, backoff })

  expect(result).toBe(2)
  expect(callback).toHaveBeenCalledTimes(2)
  expect(backoff).toHaveBeenCalledTimes(1)
  expect(backoff).toHaveBeenNthCalledWith(1, 1, 1)
})

test('repeat uses the backoff function to determine delay', async () => {
  const timestamps: number[] = []

  let t0 = Date.now()
  let iteration = 0
  let cb = async () => {
    timestamps.push(Date.now() - t0)
    t0 = Date.now()

    iteration++
    if (iteration < 3) {
      return { repeat: true, result: 'failure' }
    }
    return { repeat: false, result: 'success' }
  }

  const backoff = (iteration: number) => iteration * 100

  const result = await repeat<string>(cb, { maxIterations: 5, backoff })

  const BUFFER = 25

  expect(result).toBe('success')
  expect(timestamps.length).toBe(3)
  expect(timestamps[0]).toBeLessThan(BUFFER) // First call, no delay

  expect(timestamps[1]).toBeGreaterThanOrEqual(100 - BUFFER)
  expect(timestamps[1]).toBeLessThan(100 + BUFFER)

  expect(timestamps[2]).toBeGreaterThanOrEqual(200 - BUFFER)
  expect(timestamps[2]).toBeLessThan(200 + BUFFER)
})

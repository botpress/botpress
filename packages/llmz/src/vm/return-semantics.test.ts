import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { runAsyncFunction } from './index.js'

describe.each(['true', 'false'])('program return semantics (QuickJS=%s)', (driver) => {
  beforeEach(() => {
    vi.stubEnv('USE_QUICKJS', driver)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it.each(['operation();', 'await operation();'])(
    'awaits trailing effects without returning their value: %s',
    async (code) => {
      let completed = false
      const operation = vi.fn(async () => {
        await Promise.resolve()
        completed = true

        return { value: 42 }
      })

      const result = await runAsyncFunction({ operation }, code)

      expect(result.success).toBe(true)
      expect(completed).toBe(true)
      expect(operation).toHaveBeenCalledOnce()
      expect(result.success && result.return_value).toBeUndefined()
    }
  )

  it.each(['return operation();', 'return await operation();'])(
    'preserves an explicitly returned awaited value: %s',
    async (code) => {
      const operation = vi.fn(async () => ({ value: 42 }))

      const result = await runAsyncFunction({ operation }, code)

      expect(result.success).toBe(true)
      expect(operation).toHaveBeenCalledOnce()
      expect(result.success && result.return_value).toEqual({ value: 42 })
    }
  )
})

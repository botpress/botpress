import { afterEach, describe, expect, test, vi } from 'vitest'
import { UnknownToolError } from '../../errors.js'
import { runAsyncFunction } from '../../vm/index.js'

afterEach(() => vi.unstubAllEnvs())

describe.each(['false', 'true'])('missing tool lookup (QuickJS=%s)', (quickjs) => {
  test('rejects a missing free call before running its argument effects', async () => {
    vi.stubEnv('USE_QUICKJS', quickjs)
    const effect = vi.fn(() => 1)
    const result = await runAsyncFunction({ effect }, 'await absent(effect());')
    expect(result.success).toBe(false)
    expect(UnknownToolError.is(result.error?.cause)).toBe(true)
    expect(effect).not.toHaveBeenCalled()
  })

  test.each([
    ['function local(x) { return x + 1; } return local(2);', 3],
    ['function invoke(fn) { return fn(2); } return invoke(x => x + 1);', 3],
    ['const { fn } = { fn: x => x + 1 }; return fn(2);', 3],
    ['const fn = undefined; return fn?.();', undefined],
    ['return parseInt("3", 10);', 3],
    ['const object = { value: 3, read() { return this.value; } }; return object.read();', 3],
  ])('preserves ordinary call semantics: %s', async (source, value) => {
    vi.stubEnv('USE_QUICKJS', quickjs)
    const result = await runAsyncFunction({}, source as string)
    expect(result.success).toBe(true)
    expect(result.success && result.return_value).toBe(value)
  })

  test('a declared but non-callable local is not reported as a missing business tool', async () => {
    vi.stubEnv('USE_QUICKJS', quickjs)
    const result = await runAsyncFunction({}, 'const local = undefined; return local();')
    expect(result.success).toBe(false)
    expect(UnknownToolError.is(result.error?.cause)).toBe(false)
  })
})

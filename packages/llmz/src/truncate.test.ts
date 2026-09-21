import { describe, expect, it, vi } from 'vitest'

import { isTruncated, truncate, unwrapTruncated } from './truncate.js'

describe('truncate', () => {
  it('attaches a serializable display policy without changing the value', () => {
    const value = { content: 'Full text', entries: [1, 2, 3] }
    const wrapped = truncate({ value, maxTokens: 40_000 })

    expect(wrapped).toEqual({
      $$truncate: { signature: 'llmz.truncate.v1', maxTokens: 40_000, preserve: 'top' },
      value,
    })
    expect(wrapped.value).toBe(value)
    expect(isTruncated(JSON.parse(JSON.stringify(wrapped)))).toBe(true)
    expect(unwrapTruncated(wrapped)).toBe(value)
  })

  it.each(['top', 'bottom', 'both'] as const)('accepts preserve: %s', (preserve) => {
    const wrapped = truncate({ value: 'full value', maxTokens: 20, preserve })

    expect(wrapped.$$truncate.preserve).toBe(preserve)
    expect(unwrapTruncated(wrapped)).toBe('full value')
  })

  it('accepts a zero display budget while preserving the full value', () => {
    const wrapped = truncate({ value: 'full value', maxTokens: 0 })

    expect(wrapped.$$truncate.maxTokens).toBe(0)
    expect(unwrapTruncated(wrapped)).toBe('full value')
  })

  it.each([-1, 0.1, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1, '40'])(
    'rejects invalid maxTokens: %s',
    (maxTokens) => {
      expect(() => truncate({ value: 'text', maxTokens: maxTokens as number })).toThrow(
        'maxTokens must be a finite nonnegative integer'
      )
    }
  )

  it('rejects unsupported preserve modes', () => {
    expect(() => truncate({ value: 'text', maxTokens: 40, preserve: 'middle' as never })).toThrow(
      'preserve must be "top", "bottom", or "both"'
    )
  })

  it('distinguishes wrappers from ordinary objects and invalid metadata', () => {
    const candidates = [
      null,
      'text',
      { value: 'text', $$truncate: true },
      { value: 'text', $$truncate: { maxTokens: 40, preserve: 'top' } },
      { value: 'text', $$truncate: { signature: 'other', maxTokens: 40, preserve: 'top' } },
      { value: 'text', $$truncate: { signature: 'llmz.truncate.v1', maxTokens: Infinity, preserve: 'top' } },
      { value: 'text', $$truncate: { signature: 'llmz.truncate.v1', maxTokens: 40, preserve: 'middle' } },
    ]

    for (const candidate of candidates) {
      expect(isTruncated(candidate)).toBe(false)
      expect(unwrapTruncated(candidate)).toBe(candidate)
    }
  })

  it('does not invoke getters while detecting wrappers', () => {
    const getter = vi.fn(() => ({ signature: 'llmz.truncate.v1', maxTokens: 40, preserve: 'top' }))
    const value = { value: 'text' }
    Object.defineProperty(value, '$$truncate', { get: getter })

    expect(isTruncated(value)).toBe(false)
    expect(getter).not.toHaveBeenCalled()
  })

  it('unwraps nested plain data without modifying it', () => {
    const fullText = 'evidence '.repeat(10_000)
    const wrapped = truncate({ value: fullText, maxTokens: 20 })
    const value = Object.freeze({ chunks: Object.freeze([wrapped]), count: 1 })
    const unwrapped = unwrapTruncated(value)

    expect(unwrapped).toEqual({ chunks: [fullText], count: 1 })
    expect(value.chunks[0]).toBe(wrapped)
    expect(wrapped.value).toBe(fullText)
  })

  it('preserves ordinary cyclic values and unwraps cycles containing wrappers', () => {
    const ordinary: Record<string, unknown> = { id: 42 }
    ordinary.self = ordinary

    expect(unwrapTruncated(ordinary)).toBe(ordinary)
    expect(unwrapTruncated(truncate({ value: ordinary, maxTokens: 40 }))).toBe(ordinary)

    const wrapped: Record<string, unknown> = { content: truncate({ value: 'full text', maxTokens: 10 }) }
    wrapped.self = wrapped
    const result = unwrapTruncated(wrapped)

    expect(result.content).toBe('full text')
    expect(result.self).toBe(result)
    expect(wrapped.content).toEqual(truncate({ value: 'full text', maxTokens: 10 }))
  })

  it('preserves sparse array length when removing nested wrappers', () => {
    const value = new Array(100)
    value[0] = truncate({ value: 'first', maxTokens: 10 })

    const result = unwrapTruncated(value)

    expect(result).toHaveLength(100)
    expect(result[0]).toBe('first')
    expect(Object.hasOwn(result, 99)).toBe(false)
  })
})

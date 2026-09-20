import { afterEach, describe, expect, it, vi } from 'vitest'
import { getTokenizer } from '../utils.js'
import { countNativeRequestTokens, resolveTokenBudget } from './token-budget.js'

describe('request token budget', () => {
  const model = { input: { maxTokens: 32000 }, output: { maxTokens: 8000 } }

  it('reserves output within both the model and configured context limits', () => {
    expect(resolveTokenBudget(model)).toEqual({ limit: 32000, input: 28800, output: 3200 })
    expect(resolveTokenBudget(model, 2000)).toEqual({ limit: 2000, input: 1744, output: 256 })
    expect(resolveTokenBudget({ ...model, output: { maxTokens: 100 } }, 2000)).toEqual({
      limit: 2000,
      input: 1900,
      output: 100,
    })
    expect(resolveTokenBudget(model, 64000).limit).toBe(32000)
  })

  it.each([0, -1, NaN, Infinity, -Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid limits: %s',
    (maxTokens) => {
      expect(() => resolveTokenBudget(model, maxTokens)).toThrow(/positive safe integer/)
      expect(() => resolveTokenBudget({ ...model, input: { maxTokens } })).toThrow(/positive safe integer/)
      expect(() => resolveTokenBudget({ ...model, output: { maxTokens } })).toThrow(/positive safe integer/)
    }
  )

  it('never allocates more output than the entire context', () => {
    expect(() => resolveTokenBudget(model, 1)).toThrow(/both input and output/)
    for (const limit of [2, 8, 255, 256, 257, 2560, 160000, Number.MAX_SAFE_INTEGER]) {
      const budget = resolveTokenBudget(model, limit)
      expect(budget.input).toBeGreaterThan(0)
      expect(budget.output).toBeGreaterThan(0)
      expect(budget.input + budget.output).toBe(budget.limit)
      expect(Number.isSafeInteger(budget.output)).toBe(true)
    }
  })

  it('fits every fallback model, including one with a smaller output limit', () => {
    expect(
      resolveTokenBudget([
        model,
        { input: { maxTokens: 2000 }, output: { maxTokens: 4000 } },
        { input: { maxTokens: 8000 }, output: { maxTokens: 64 } },
      ])
    ).toEqual({ limit: 2000, input: 1936, output: 64 })
    expect(() => resolveTokenBudget([])).toThrow(/At least one/)
  })
})

describe('native token measurement', () => {
  afterEach(() => vi.restoreAllMocks())

  it('uses exact tokenization for enforcement even when the approximation is smaller', () => {
    const count = vi
      .spyOn(getTokenizer(), 'count')
      .mockImplementation((_text, options) => (options?.approximate === false ? 100 : 1))
    expect(countNativeRequestTokens([{ role: 'user', content: 'Request' }], [])).toBe(100)
    expect(count).toHaveBeenCalledWith(expect.any(String), { approximate: false })
  })

  it('excludes only media transport payloads and preserves business data', () => {
    const url = 'data:image/png;base64,' + 'payload'.repeat(50)
    const media = [{ role: 'user' as const, type: 'multipart' as const, content: [{ type: 'image' as const, url }] }]
    const original = structuredClone(media)
    expect(countNativeRequestTokens(media, [])).toBe(
      countNativeRequestTokens([{ ...media[0]!, content: [{ type: 'image', url: 'short' }] }], [])
    )
    expect(countNativeRequestTokens([{ role: 'user', content: url }], [])).toBeGreaterThan(
      countNativeRequestTokens(media, [])
    )
    expect(countNativeRequestTokens([], [{ description: url }])).toBeGreaterThan(countNativeRequestTokens(media, []))
    expect(media).toEqual(original)
  })

  it.each([NaN, Infinity, -1, 0.5])('rejects an invalid tokenizer count: %s', (count) => {
    vi.spyOn(getTokenizer(), 'count').mockReturnValue(count)
    expect(() => countNativeRequestTokens([], [])).toThrow(/nonnegative safe integer/)
  })
})

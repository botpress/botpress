import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { extractType, inspect } from './inspect.js'
import { truncate } from './truncate.js'
import * as utils from './utils.js'

const OPTIONS = { tokens: 1_000 }

beforeAll(async () => {
  await utils.init()
})

afterEach(() => {
  vi.restoreAllMocks()
})

function expectBounded(output: string, tokens: number) {
  expect(utils.getTokenizer().count(output, { approximate: false })).toBeLessThanOrEqual(tokens)
}

describe('Inspect Array', () => {
  it('shows all elements of a short array', () => {
    const items = [1, 'hello', null, new Date('2020-10-12'), { active: true }]

    expect(inspect(items, 'shortArray', OPTIONS)).toMatchInlineSnapshot(`
      "// const shortArray: Array
      // Array Preview
      --------------
      [0]              <number> 1
      [1]              "hello"
      [2]              <nil>
      [3]              <date> 2020-10-12T00:00:00.000Z
      [4]              <object> {
        "active": true
      }"
    `)
  })

  it('truncates long arrays within the requested budget', () => {
    const items = Array.from({ length: 100_000 }, (_, index) => `value${index}`)
    const output = inspect(items, 'longArray', OPTIONS)

    expect(output).toContain('100000 items')
    expect(output).toContain('value0')
    expect(output).toContain('[truncated]')
    expect(output).not.toContain('value99999')
    expectBounded(output, OPTIONS.tokens)
    expect(items).toHaveLength(100_000)
    expect(items[99_999]).toBe('value99999')
  })

  it('does not traverse a huge sparse array beyond its preview', () => {
    const items: unknown[] = []
    const read = vi.fn(() => 'unreachable')
    items.length = 1_000_000
    Object.defineProperty(items, 999_999, { get: read })

    const output = inspect(items, undefined, { tokens: 40, compact: true })

    expect(output).toContain('[truncated]')
    expectBounded(output, 40)
    expect(read).not.toHaveBeenCalled()
  })

  it('shows an empty array', () => {
    expect(inspect([], 'emptyArr', OPTIONS)).toBe('// const emptyArr: Array\n// Array Is Empty (0 element)')
  })
})

describe('Inspect Object', () => {
  it('preserves the detailed format for a small object', () => {
    const value = { name: 'John', age: 21, dob: new Date('2000-01-01') }

    expect(inspect(value, 'smallObject', OPTIONS)).toMatchInlineSnapshot(`
      "// const smallObject: object
      // Object Preview
      --------------
      {
        \"name\": \"John\",
        \"age\": 21,
        \"dob\": 2000-01-01T00:00:00.000Z
      }"
    `)
  })

  it('bounds the output for objects with many entries', () => {
    const value = Object.fromEntries(Array.from({ length: 10_000 }, (_, index) => [`key${index}`, index]))
    const output = inspect(value, 'largeObject', { tokens: 120 })

    expect(output).toContain('key0')
    expect(output).toContain('[truncated]')
    expectBounded(output, 120)
  })

  it('bounds deeply nested objects and large nested strings', () => {
    let value: unknown = { content: 'Hello, world\n'.repeat(100_000) }

    for (let depth = 0; depth < 1_000; depth++) {
      value = { child: value }
    }

    const output = inspect(value, undefined, { tokens: 80 })

    expect(output).toContain('child')
    expect(output).toContain('[truncated]')
    expectBounded(output, 80)
  })

  it('shows an empty object', () => {
    expect(inspect({}, 'empty', OPTIONS)).toBe('// const empty: object\n// Empty Object {}')
  })

  it('does not invoke getters or toJSON while rendering', () => {
    const getter = vi.fn(() => 'secret')
    const toJSON = vi.fn(() => 'not the original object')
    const value = { toJSON }
    Object.defineProperty(value, 'computed', { enumerable: true, get: getter })

    const output = inspect(value, undefined, { tokens: 100, compact: true })

    expect(output).toContain('[Getter]')
    expect(getter).not.toHaveBeenCalled()
    expect(toJSON).not.toHaveBeenCalled()
  })
})

describe('Inspect Text', () => {
  it('shows short text', () => {
    expect(inspect('Hello, World', 'greeting', OPTIONS)).toBe('// const greeting: string\nHello, World')
  })

  it('preserves retrieved Markdown paragraphs, tables, citations, and code samples', () => {
    const text = [
      '# Refund policy',
      '',
      'Customers may request a refund within **30 days**. [1](https://example.com/policy)',
      '',
      '| Plan | Refund window |',
      '| --- | --- |',
      '| Standard | 30 days |',
      '',
      '```ts',
      'const eligible = daysSincePurchase <= 30',
      '```',
      '',
      'A literal \\n remains a backslash followed by n.',
    ].join('\n')

    const output = inspect(text, undefined, OPTIONS)

    expect(output).toBe(text)
    expect(output).not.toContain('<string>')
    expectBounded(output, OPTIONS.tokens)
  })

  it('preserves CRLF and distinguishes literal backslashes from line breaks', () => {
    const text = 'First paragraph\r\n\r\nLiteral \\n and \\r\\n stay literal.\r\nLast line.'

    expect(inspect(text, undefined, OPTIONS)).toBe(text)
  })

  it('keeps nested retrieved text distinct from its metadata', () => {
    const text = 'First paragraph.\n\nSecond paragraph with [1](https://example.com).'
    const output = inspect([{ text, citation: 'source-42' }], undefined, OPTIONS)

    expect(output).toContain(`"text": ${JSON.stringify(text)}`)
    expect(output).toContain('"citation": "source-42"')
    expectBounded(output, OPTIONS.tokens)
  })

  it('preserves text inside nested arrays and objects', () => {
    const value = {
      chunks: [{ body: '<pre>\r\nfunction example() {\r\n  return "literal \\n";\r\n}\r\n</pre>\r\n' }],
      notes: ['First\nSecond', '\tindented\n  two spaces\n', '```js\ncode\n```'],
    }
    const output = inspect(value, undefined, OPTIONS)

    expect(JSON.parse(output.slice(output.indexOf('{')))).toEqual(value)
  })

  it('bounds nested Markdown without creating an outer fence that truncation could leave open', () => {
    const text = '# Example\n\n```ts\n' + 'const value = "🧠漢字"\n'.repeat(1_000) + '```\n'
    const output = inspect({ content: text }, undefined, { tokens: 80, maxStringLength: Infinity })

    expect(output).toContain('"content": "# Example\\n\\n```ts\\n')
    expect(output).toContain('[truncated]')
    expect(output).not.toMatch(/^ {0,3}```/m)
    expectBounded(output, 80)
  })

  it('keeps compact previews escaped and on one line', () => {
    const text = '# Guide\n\nActual line break; literal \\n.\n```ts\nconst x = 1\n```'
    const output = inspect(text, undefined, { tokens: 100, compact: true })

    expect(output).toBe(JSON.stringify(text))
    expect(output).not.toContain('\n')
    expectBounded(output, 100)
  })

  it.each([false, true])('bounds long text when compact is %s', (compact) => {
    const value = 'Hello, world https://example.com user@example.com\n'.repeat(100_000)
    const output = inspect(value, 'longText', { tokens: 100, compact, maxStringLength: Infinity })

    expect(output).toContain('Hello')
    expect(output).toContain('[truncated]')
    expectBounded(output, 100)
  })

  it('marks explicit string clipping even when it fits the token budget', () => {
    const output = inspect('abcdefghij', undefined, { tokens: 100, maxStringLength: 4, compact: true })

    expect(output).toBe('"abcd..." [truncated]')
    expectBounded(output, 100)
  })
})

describe('Compact inspection', () => {
  it('shows concise JavaScript-like values without report headings', () => {
    const output = inspect({ age: 42, name: 'Maya', 'a key': [true, null] }, undefined, { tokens: 80, compact: true })

    expect(output).toBe('{ age: 42, name: "Maya", "a key": [ true, null ] }')
    expect(output).not.toContain('\n')
  })

  it('escapes strings and multiline object keys', () => {
    const output = inspect({ 'line\nbreak': 'one\ntwo' }, undefined, { tokens: 80, compact: true })

    expect(output).toBe('{ "line\\nbreak": "one\\ntwo" }')
  })

  it('handles circular references, bigint, undefined, and invalid dates', () => {
    const value = { bigint: 123n, optional: undefined, date: new Date(NaN), self: null as unknown }
    value.self = value

    const output = inspect(value, undefined, { tokens: 80, compact: true })

    expect(output).toContain('bigint: 123n')
    expect(output).toContain('optional: undefined')
    expect(output).toContain('date: Invalid Date')
    expect(output).toContain('self: [Circular]')
    expectBounded(output, 80)
    expect(value.self).toBe(value)
    expect(value.bigint).toBe(123n)
  })

  it('shows repeated non-circular values', () => {
    const value = { id: 42 }

    expect(inspect([value, value], undefined, { tokens: 80, compact: true })).toBe('[ { id: 42 }, { id: 42 } ]')
  })

  it('preserves standard error subclass names', () => {
    const output = inspect(new TypeError('Unexpected input'), undefined, { tokens: 80, compact: true })

    expect(output).toContain('name: "TypeError"')
    expect(output).toContain('message: "Unexpected input"')
  })

  it('keeps symbols on a single line', () => {
    const output = inspect(Symbol('line\nbreak'), undefined, { tokens: 80, compact: true })

    expect(output).not.toContain('\n')
    expect(output).toContain('line\\nbreak')
  })
})

describe('Inspection budgets', () => {
  it.each([false, true])('includes names, headings, and errors in the budget when compact is %s', (compact) => {
    const error = new Error('failure '.repeat(10_000))
    error.stack = 'stack frame\n'.repeat(10_000)

    const values = [
      '🧠漢字 e\u0301\n'.repeat(10_000),
      error,
      Array.from({ length: 5_000 }, (_, index) => ({ index, text: 'payload '.repeat(100) })),
      { ['hugeKey'.repeat(10_000)]: true },
      1234567890123456789012345678901234567890n,
    ]

    for (const value of values) {
      for (const tokens of [0, 1, 2, 4, 10, 40, 80]) {
        const output = inspect(value, 'variable'.repeat(1_000), { tokens, compact, maxStringLength: Infinity })

        expectBounded(output, tokens)

        if (tokens >= 10) {
          expect(output).toContain('[truncated]')
        }
      }
    }
  })

  it('includes error details and stack traces in the same budget', () => {
    const error = new Error('service rejected request: ' + 'detail '.repeat(10_000))
    error.stack = 'stack frame\n'.repeat(10_000)

    for (const compact of [false, true]) {
      const output = inspect(error, undefined, { tokens: 80, compact })

      expect(output).toContain('service rejected request')
      expect(output).toContain('[truncated]')
      expectBounded(output, 80)
    }
  })

  it('bounds failures raised by a proxy while inspecting', () => {
    const value = new Proxy(
      {},
      {
        ownKeys() {
          throw new Error('cannot enumerate '.repeat(10_000))
        },
      }
    )

    const output = inspect(value, undefined, { tokens: 40, compact: true })

    expect(output).toContain('cannot enumerate')
    expect(output).toContain('[truncated]')
    expectBounded(output, 40)
  })

  it('uses a conservative bounded preview before tokenizer initialization', () => {
    vi.spyOn(utils, 'getTokenizer').mockImplementation(() => {
      throw new Error('Tokenizer not initialized, make sure to call init() first and await it')
    })

    const short = inspect({ ready: true }, undefined, { tokens: 40, compact: true })
    const long = inspect('🧠漢字'.repeat(10_000), undefined, { tokens: 40, compact: true })

    expect(short).toBe('{ ready: true }')
    expect(long).toContain('[truncated]')
    expect(new TextEncoder().encode(long).length).toBeLessThanOrEqual(40)
  })

  it('does not mutate caller options', () => {
    const options = Object.freeze({ tokens: 80, compact: true })

    expect(inspect({ ready: true }, undefined, options)).toBe('{ ready: true }')
    expect(options).toEqual({ tokens: 80, compact: true })
  })

  it('retains default options for JavaScript callers passing null', () => {
    expect(inspect('value', undefined, null as never)).toBe('value')
  })
})

describe('Per-value truncation policies', () => {
  it('honors a 40000-token override without the old string clipping limit', () => {
    const value = 'evidence '.repeat(10_000) + 'LATE EVIDENCE\n' + 'remaining '.repeat(50_000)
    const wrapped = truncate({ value, maxTokens: 40_000 })
    const output = inspect(wrapped, undefined, { tokens: 2_000 })

    expect(output).toContain('LATE EVIDENCE')
    expect(output).toContain('[truncated]')
    expect(utils.getTokenizer().count(output, { approximate: false })).toBeGreaterThan(2_000)
    expectBounded(output, 40_000)
    expect(wrapped.value).toBe(value)
  })

  it('lets an explicit policy display more than 100 array entries', () => {
    const value = Array.from({ length: 2_000 }, (_, index) => `item-${index}`)
    const output = inspect(truncate({ value, maxTokens: 40_000 }), undefined, { tokens: 2_000 })

    expect(output).toContain('[1500]')
    expect(output).toContain('item-1999')
    expectBounded(output, 40_000)
  })

  it('raises the enclosing budget for a nested override while keeping smaller subtree limits', () => {
    const value = {
      brief: truncate({ value: 'BRIEF START ' + 'detail '.repeat(500) + 'BRIEF END', maxTokens: 20 }),
      evidence: truncate({
        value: 'evidence '.repeat(10_000) + 'LATE EVIDENCE\n' + 'remaining '.repeat(50_000),
        maxTokens: 40_000,
      }),
    }
    const output = inspect(value, undefined, { tokens: 2_000 })

    expect(output).toContain('BRIEF START')
    expect(output).not.toContain('BRIEF END')
    expect(output).toContain('LATE EVIDENCE')
    expect(output).not.toContain('$$truncate')
    expect(utils.getTokenizer().count(output, { approximate: false })).toBeGreaterThan(2_000)
    expectBounded(output, 40_000)
  })

  it('keeps an explicit root cap even when a nested value requests more', () => {
    const value = { content: truncate({ value: 'detail '.repeat(10_000), maxTokens: 40_000 }) }
    const output = inspect(truncate({ value, maxTokens: 80 }), undefined, { tokens: 2_000 })

    expect(output).toContain('[truncated]')
    expectBounded(output, 80)
  })

  it.each(['top', 'bottom', 'both'] as const)('preserves the actual %s of a large text value', (preserve) => {
    const value = 'START OF EVIDENCE\n' + 'middle 🧠漢字 '.repeat(20_000) + '\nEND OF EVIDENCE'
    const output = inspect(truncate({ value, maxTokens: 80, preserve }), undefined, { tokens: 2_000 })

    if (preserve === 'top' || preserve === 'both') {
      expect(output).toContain('START OF EVIDENCE')
    }

    if (preserve === 'bottom' || preserve === 'both') {
      expect(output).toContain('END OF EVIDENCE')
    }

    expect(output).toContain('[truncated]')
    expectBounded(output, 80)
  })

  it.each(['bottom', 'both'] as const)('preserves the actual %s of a large array', (preserve) => {
    const value = Array.from({ length: 10_000 }, (_, index) => `item-${index}`)
    const output = inspect(truncate({ value, maxTokens: 80, preserve }), undefined, { tokens: 2_000 })

    expect(output).toContain('item-9999')

    if (preserve === 'both') {
      expect(output).toContain('item-0')
    }

    expect(output).toContain('[truncated]')
    expectBounded(output, 80)
  })

  it.each(['top', 'bottom', 'both'] as const)(
    'keeps Unicode intact when preserving %s at token boundaries',
    (preserve) => {
      for (const maxTokens of [5, 6, 7, 8, 9, 10, 20]) {
        const value = truncate({ value: '🧠漢字'.repeat(1_000), maxTokens, preserve })
        const output = inspect(value, undefined, { tokens: 2_000 })

        expect(output).not.toContain('\uFFFD')
        expectBounded(output, maxTokens)
      }
    }
  )

  it('can disable overrides while still hiding wrapper metadata', () => {
    const value = truncate({ value: 'head '.repeat(10_000) + 'LATE EVIDENCE', maxTokens: 40_000, preserve: 'bottom' })
    const output = inspect(value, undefined, { tokens: 60, compact: true, honorTruncation: false })

    expect(output).toContain('head')
    expect(output).not.toContain('LATE EVIDENCE')
    expect(output).not.toContain('$$truncate')
    expectBounded(output, 60)
  })

  it('allows a zero per-value budget without removing the original data', () => {
    const wrapped = truncate({ value: 'full data', maxTokens: 0 })

    expect(inspect(wrapped, undefined, { tokens: 2_000 })).toBe('')
    expect(wrapped.value).toBe('full data')
  })
})

describe('Type extraction', () => {
  it('summarizes array item types without recursing through cycles', () => {
    const array: unknown[] = [1, null]
    array.push(array)

    expect(extractType(array)).toBe('Array<number | null | Array>')
  })
})

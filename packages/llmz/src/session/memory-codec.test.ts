import { describe, expect, it, vi } from 'vitest'
import {
  cloneMemoryValue,
  decodeMemoryValue,
  encodeMemoryValue,
  freezeMemoryValue,
  type EncodedMemoryValue,
} from './memory-codec.js'

describe('exact memory codec', () => {
  it.each([undefined, null, true, false, 0, -0, 42.5, '🧠漢字', [undefined, -0], { unset: undefined, zero: -0 }])(
    'round-trips %j through JSON without changing its value',
    (value) => {
      const restored = decodeMemoryValue(JSON.parse(JSON.stringify(encodeMemoryValue(value))))
      expect(restored).toEqual(value)
      if (typeof value === 'number') {
        expect(Object.is(restored, value)).toBe(true)
      }
    }
  )

  it('isolates values and recursively freezes retained copies', () => {
    const value = { child: { items: [1, 2] } }
    const copy = freezeMemoryValue(cloneMemoryValue(value)) as typeof value
    expect(() => copy.child.items.push(3)).toThrow()
    value.child.items.push(4)
    expect(copy.child.items).toEqual([1, 2])
  })

  it('preserves special object keys as data', () => {
    const value = JSON.parse('{"__proto__":{"polluted":true},"constructor":"data"}')
    const restored = cloneMemoryValue(value) as Record<string, unknown>
    expect(Object.hasOwn(restored, '__proto__')).toBe(true)
    expect(restored.constructor).toBe('data')
    expect(Object.getPrototypeOf(restored)).toBe(Object.prototype)
    expect({}).not.toHaveProperty('polluted')
  })

  it('rejects getters without executing them', () => {
    const get = vi.fn(() => 'side effect')
    expect(() => cloneMemoryValue(Object.defineProperty({}, 'value', { enumerable: true, get }))).toThrow(/Accessor/)
    expect(get).not.toHaveBeenCalled()
  })

  it.each([
    [],
    ['undefined', 1],
    ['negative-zero', 0],
    ['value'],
    ['value', Infinity],
    ['value', {}],
    ['array', {}],
    ['array', [null]],
    ['object', [['a']]],
    ['object', [[1, ['value', 2]]]],
    [
      'object',
      [
        ['a', ['value', 1]],
        ['a', ['value', 2]],
      ],
    ],
    ['unknown', 1],
  ])('rejects malformed encoded values: %j', (...value) => {
    expect(() => decodeMemoryValue(value as EncodedMemoryValue)).toThrow()
  })
})

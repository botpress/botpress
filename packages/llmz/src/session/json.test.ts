import { describe, expect, it, vi } from 'vitest'
import { assertPersistableData, stableJSON } from './json.js'

describe('session JSON data', () => {
  it('compares objects independently of key order while retaining array order', () => {
    expect(stableJSON({ b: [{ z: 1, a: 2 }], a: false })).toBe(stableJSON({ a: false, b: [{ a: 2, z: 1 }] }))
    expect(stableJSON([1, 2])).not.toBe(stableJSON([2, 1]))
    expect(stableJSON({ a: null })).not.toBe(stableJSON({}))
  })

  it('allows shared references but rejects cycles', () => {
    const child = { signature: 'opaque' }
    expect(() => assertPersistableData({ a: child, b: child })).not.toThrow()
    const cycle: Record<string, unknown> = {}
    cycle.self = cycle
    expect(() => assertPersistableData(cycle)).toThrow(/acyclic/)
  })

  it.each([NaN, Infinity, -Infinity, 1n, () => {}, Symbol('value'), new Map(), new Date(), new Uint8Array(2)])(
    'rejects data that cannot survive JSON persistence: %s',
    (value) => {
      expect(() => assertPersistableData({ provider: value })).toThrow()
    }
  )

  it('rejects array accessors without executing them', () => {
    const getter = vi.fn(() => {
      throw new Error('Must not run')
    })
    const array = Object.defineProperty([], 0, { enumerable: true, get: getter })
    expect(() => assertPersistableData(array)).toThrow(/plain JSON/)
    expect(getter).not.toHaveBeenCalled()
  })

  it('rejects holes even when custom properties disguise the missing elements', () => {
    const sparse = Object.assign(new Array(1), { extra: 1 })
    expect(() => assertPersistableData(sparse)).toThrow(/dense/)
    expect(() => assertPersistableData([undefined])).toThrow(/dense/)
    expect(() => assertPersistableData(Object.assign([1], { extra: 2 }))).toThrow(/dense/)
  })
})

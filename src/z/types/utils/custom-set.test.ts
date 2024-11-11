import { it, expect } from 'vitest'
import { CustomSet } from './custom-set'

describe('CustomSet', () => {
  it('does not contain the same item twice', () => {
    const set = new CustomSet([1, 1, 1])
    expect(set.size).toBe(1)
  })

  it('uses the provided equality function', () => {
    const set = new CustomSet([1, 2, 3], {
      compare: (a, b) => Math.floor(a / 2) === Math.floor(b / 2),
    })
    expect(set.size).toBe(2)
  })

  it('is subset of another set with more items', () => {
    const set = new CustomSet([1, 2])
    const other = new CustomSet([1, 2, 3])
    expect(set.isSubsetOf(other)).toBe(true)
  })

  it('is not subset of another set with less items', () => {
    const set = new CustomSet([1, 2, 3])
    const other = new CustomSet([1, 2])
    expect(set.isSubsetOf(other)).toBe(false)
  })
})

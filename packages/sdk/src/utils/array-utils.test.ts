import { describe, it, expect } from 'vitest'
import { safePush, unique } from './array-utils'

describe('safePush', () => {
  it('should append values to an existing array', () => {
    const arr = [1, 2, 3]
    const result = safePush(arr, 4, 5)
    expect(result).toEqual([1, 2, 3, 4, 5])
  })

  it('should create a new array if arr is undefined', () => {
    const result = safePush(undefined, 1, 2)
    expect(result).toEqual([1, 2])
  })

  it('should return the same array if no values are provided', () => {
    const arr = [1, 2]
    const result = safePush(arr)
    expect(result).toEqual([1, 2])
  })

  it('should handle empty array and no values', () => {
    const arr: number[] = []
    const result = safePush(arr)
    expect(result).toEqual([])
  })

  it('should handle undefined array and no values', () => {
    const result = safePush(undefined)
    expect(result).toEqual([])
  })

  it('should work with generic types (string)', () => {
    const arr = ['a', 'b']
    const result = safePush(arr, 'c')
    expect(result).toEqual(['a', 'b', 'c'])
  })
})

describe('unique', () => {
  it('should remove duplicate numbers', () => {
    const arr = [1, 2, 2, 3, 1]
    const result = unique(arr)
    expect(result).toEqual([1, 2, 3])
  })

  it('should remove duplicate strings', () => {
    const arr = ['a', 'b', 'a', 'c', 'b']
    const result = unique(arr)
    expect(result).toEqual(['a', 'b', 'c'])
  })

  it('should return the same array if all elements are unique', () => {
    const arr = [1, 2, 3]
    const result = unique(arr)
    expect(result).toEqual([1, 2, 3])
  })

  it('should return an empty array if input is empty', () => {
    const arr: number[] = []
    const result = unique(arr)
    expect(result).toEqual([])
  })

  it('should work with objects by reference', () => {
    const obj1 = { a: 1 }
    const obj2 = { a: 1 }
    const arr = [obj1, obj2, obj1]
    const result = unique(arr)
    expect(result).toEqual([obj1, obj2])
  })
})

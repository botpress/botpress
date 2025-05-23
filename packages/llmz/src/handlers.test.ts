import { describe, it, expect, vi } from 'vitest'

import { HookedArray } from './handlers.js'

describe('HookedArray', () => {
  it('no subscribers', () => {
    const array = new HookedArray<number>()
    array.push(1)
    expect(array).toEqual([1])
  })

  it('single susbcriber', () => {
    const array = new HookedArray<number>()
    array.push(1)
    const fn = vi.fn()
    array.onPush(fn)
    array.push(2)
    expect(array).toEqual([1, 2])
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith([2])
  })

  it('unsubscribe works ', () => {
    const array = new HookedArray<number>()
    array.push(1)
    const fn = vi.fn()
    const remove = array.onPush(fn)
    array.push(2)
    remove()
    array.push(3)
    expect(array).toEqual([1, 2, 3])
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith([2])
  })

  it('multiple subscribers', () => {
    const array = new HookedArray<number>()
    array.push(1)
    const fn1 = vi.fn()
    const fn2 = vi.fn()
    array.onPush(fn1)
    array.onPush(fn2)
    array.push(2)
    expect(array).toEqual([1, 2])
    expect(fn1).toHaveBeenCalledTimes(1)
    expect(fn1).toHaveBeenCalledWith([2])
    expect(fn2).toHaveBeenCalledTimes(1)
    expect(fn2).toHaveBeenCalledWith([2])
  })
})

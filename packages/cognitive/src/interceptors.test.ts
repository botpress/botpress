import { describe, expect, test } from 'vitest'
import { InterceptorManager } from './interceptors'

describe('interceptors', () => {
  test('executes each interceptor in order', async () => {
    const manager = new InterceptorManager<number>()
    const calls: number[] = []

    manager.use((_err, val, next) => {
      calls.push(1)
      next(null, val)
    })
    manager.use((_err, val, next) => {
      calls.push(2)
      next(null, val)
    })

    await manager.run(0, new AbortController().signal)
    expect(calls).toEqual([1, 2])
  })

  test('bypasses next interceptor(s) when done is called', async () => {
    const manager = new InterceptorManager<number>()
    const calls: number[] = []

    manager.use((_err, val, _next, done) => {
      calls.push(1)
      done(null, val)
    })
    manager.use((_err, val, next) => {
      calls.push(2)
      next(null, val)
    })

    await manager.run(0, new AbortController().signal)
    expect(calls).toEqual([1])
  })

  test('aborts execution when signal is aborted', async () => {
    const manager = new InterceptorManager<number>()
    const controller = new AbortController()
    manager.use((_err, val, next) => {
      next(null, val)
    })

    controller.abort('aborted')
    await expect(manager.run(0, controller.signal)).rejects.toBe('aborted')
  })

  test('throws error at the end when error is set', async () => {
    const manager = new InterceptorManager<number>()
    let secondCalled = false
    manager.use((_err, val, next) => {
      next('some error', val)
    })

    manager.use((_err, val, next) => {
      secondCalled = true
      next(_err, val)
    })

    await expect(manager.run(0, new AbortController().signal)).rejects.toBe('some error')
    expect(secondCalled).toBe(true)
  })

  test('can undo error in next interceptor', async () => {
    const manager = new InterceptorManager<number>()
    manager.use((_err, val, next) => {
      next('some error', val)
    })

    manager.use((_err, _val, next) => {
      next(null, 666)
    })

    const result = await manager.run(0, new AbortController().signal)
    expect(result).toBe(666)
  })

  test('returns value at the end when no error is set', async () => {
    const manager = new InterceptorManager<number>()
    manager.use((_err, val, next) => {
      next(null, val + 1)
    })
    manager.use((_err, val, next) => {
      next(null, val + 2)
    })

    const result = await manager.run(0, new AbortController().signal)
    expect(result).toBe(3)
  })
})

import 'bluebird-global'
import 'reflect-metadata'

import { IO } from '../../../common'

import Queue from './memory-queue'

describe('Memory Queue', () => {
  const options = { retries: 1 }
  let logger, queue: Queue

  beforeEach(() => {
    logger = { warn: jest.fn(), error: jest.fn() }
    queue = new Queue('name', logger, options)
  })

  afterEach(() => {
    queue.dispose()
  })

  it('Respects order (sync)', async () => {
    const order: number[] = []

    queue.subscribe((event: IO.Event) => {
      order.push(event.id! as number) // Sync processing
    })

    for (let i = 0; i < 10; i++) {
      await queue.enqueue({ userId: 'a', id: i })
    }

    while (!(await queue.isEmpty())) {
      await Promise.delay(1)
    }

    expect(order.length).toBe(10)
    expect(order).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('Respects order (async)', async () => {
    const order: number[] = []

    queue.subscribe(async (event: IO.Event) => {
      await Promise.delay(1) // Async processing
      order.push(event.id! as number)
    })

    for (let i = 0; i < 10; i++) {
      await queue.enqueue({ userId: 'a', id: i })
    }

    while (!(await queue.isEmpty())) {
      await Promise.delay(5)
    }

    await Promise.delay(1)

    expect(order.length).toBe(10)
    expect(order).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('Retries failed jobs once', async () => {
    const order: number[] = []

    let i = 0

    queue.subscribe(async (event: IO.Event) => {
      if (i === 0) {
        i++
        throw new Error('Failed job')
      }

      order.push(event.id! as number)
    })

    await queue.enqueue({ userId: 'a', id: 1 })

    while (!(await queue.isEmpty())) {
      await Promise.delay(5)
    }
    await Promise.delay(5)

    expect(logger.warn.mock.calls.length).toBeGreaterThan(0) // Failed
    expect(logger.error.mock.calls.length).toBe(0) // But not dropped

    expect(order.length).toBe(1)
  })

  it('Abandon retrying after two errors', async () => {
    const order: number[] = []
    let i = 0
    queue.subscribe(async (event: IO.Event) => {
      if (i <= 1) {
        i++
        throw new Error('Failed job')
      }
      order.push(event.id! as number)
    })

    await queue.enqueue({ userId: 'a', id: 1 })

    while (!(await queue.isEmpty())) {
      await Promise.delay(5)
    }
    await Promise.delay(5)

    expect(logger.warn.mock.calls.length).toBeGreaterThan(0) // Failed
    expect(logger.error.mock.calls.length).toBeGreaterThan(0) // Also dropped

    expect(order.length).toBe(0)
  })

  it('Runs in parallel for different users', async () => {
    const order: number[] = []
    queue.subscribe(async (event: IO.Event) => {
      order.push(event.id! as number)
      if (event.target === 'a') {
        await Promise.delay(5)
      }
    })

    await queue.enqueue({ userId: 'a', id: 1 })
    await queue.enqueue({ userId: 'a', id: 3 }) // This message will be locked
    await queue.enqueue({ userId: 'b', id: 2 }) // But this message will process even if user 'a' is locked

    while (!(await queue.isEmpty())) {
      await Promise.delay(5)
    }
    await Promise.delay(5)

    expect(order.length).toBe(3)
    expect(order).toEqual([1, 2, 3])
  })

  it('Cancels all only for requested user', async () => {
    const userListA: number[] = []
    const userListB: number[] = []
    queue.subscribe(async (event: IO.Event) => {
      await Promise.delay(1)
      if (event.target === 'a') {
        userListA.push(event.id! as number)
      }
      if (event.target === 'b') {
        userListB.push(event.id! as number)
      }
    })

    for (let i = 0; i < 10; i++) {
      await queue.enqueue({ userId: 'a', id: i })
    }
    await queue.cancelAll({ userId: 'a' })
    for (let i = 10; i < 20; i++) {
      await queue.enqueue({ userId: 'b', id: i })
    }

    await Promise.delay(25)

    expect(userListA.length).toBeLessThan(10)
    expect(userListB.length).toBe(10)
    expect(userListB).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19])
  })
})

import 'bluebird-global'
import 'reflect-metadata'

import { BotpressEvent } from '../../misc/interfaces'

import Queue from './memory-queue'

describe('Memory Queue', () => {
  const options = { retries: 1 }
  let logger, queue

  beforeEach(() => {
    logger = { warn: jest.fn(), error: jest.fn() }
    queue = new Queue('name', logger, options)
  })

  it('Respects order (sync)', async () => {
    const order: string[] = []

    queue.subscribe((event: BotpressEvent) => {
      order.push(event.id!) // Sync processing
    })

    for (let i = 0; i < 10; i++) {
      queue.enqueue({ userId: 'a', id: i })
    }

    while (queue.queue.length) {
      await Promise.delay(1)
    }

    expect(order.length).toBe(10)
    expect(order).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('Respects order (async)', async () => {
    const order: string[] = []

    queue.subscribe(async (event: BotpressEvent) => {
      await Promise.delay(1) // Async processing
      order.push(event.id!)
    })

    for (let i = 0; i < 10; i++) {
      queue.enqueue({ userId: 'a', id: i })
    }

    while (queue.queue.length) {
      await Promise.delay(5)
    }

    await Promise.delay(1)

    expect(order.length).toBe(10)
    expect(order).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('Retries failed jobs once', async () => {
    const order: string[] = []

    let i = 0

    queue.subscribe(async (event: BotpressEvent) => {
      if (i === 0) {
        i++
        throw new Error('Failed job')
      }

      order.push(event.id!)
    })

    queue.enqueue({ userId: 'a', id: 1 })

    while (queue.queue.length) {
      await Promise.delay(5)
    }
    await Promise.delay(5)

    expect(logger.warn.mock.calls.length).toBeGreaterThan(0) // Failed
    expect(logger.error.mock.calls.length).toBe(0) // But not dropped

    expect(order.length).toBe(1)
  })

  it('Abandon retrying after two errors', async () => {
    const order: string[] = []
    let i = 0
    queue.subscribe(async (event: BotpressEvent) => {
      if (i <= 1) {
        i++
        throw new Error('Failed job')
      }
      order.push(event.id!)
    })

    queue.enqueue({ userId: 'a', id: 1 })

    while (queue.queue.length) {
      await Promise.delay(5)
    }
    await Promise.delay(5)

    expect(logger.warn.mock.calls.length).toBeGreaterThan(0) // Failed
    expect(logger.error.mock.calls.length).toBeGreaterThan(0) // Also dropped

    expect(order.length).toBe(0)
  })

  it('Runs in parallel for different users', async () => {
    const order: string[] = []
    queue.subscribe(async (event: BotpressEvent) => {
      order.push(event.id!)
      if (event.userId === 'a') {
        await Promise.delay(5)
      }
    })

    queue.enqueue({ userId: 'a', id: 1 })
    queue.enqueue({ userId: 'a', id: 3 }) // This message will be locked
    queue.enqueue({ userId: 'b', id: 2 }) // But this message will process even if user 'a' is locked

    while (queue.queue.length) {
      await Promise.delay(5)
    }
    await Promise.delay(5)

    expect(order.length).toBe(3)
    expect(order).toEqual([1, 2, 3])
  })

  it('Cancels all only for requested user', async () => {
    const userListA: string[] = []
    const userListB: string[] = []
    queue.subscribe(async (event: BotpressEvent) => {
      await Promise.delay(1)
      if (event.userId === 'a') {
        userListA.push(event.id!)
      }
      if (event.userId === 'b') {
        userListB.push(event.id!)
      }
    })

    for (let i = 0; i < 10; i++) {
      queue.enqueue({ userId: 'a', id: i })
    }
    queue.cancelAll({ userId: 'a' })
    for (let i = 10; i < 20; i++) {
      queue.enqueue({ userId: 'b', id: i })
    }

    await Promise.delay(25)

    expect(userListA.length).toBeLessThan(10)
    expect(userListB.length).toBe(10)
    expect(userListB).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19])
  })
})

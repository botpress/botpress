import 'bluebird-global'
import _ from 'lodash'
import 'reflect-metadata'

import { Event } from '../../../core/sdk/impl'
import { PersistedConsoleLogger } from '../../logger'
import { createSpyObject, MockObject } from '../../misc/utils'

import MemoryQueue from './memory-queue'

describe('Lite Queues', () => {
  const options = { retries: 1 }
  const logger: MockObject<PersistedConsoleLogger> = createSpyObject<PersistedConsoleLogger>()
  let queue: MemoryQueue

  const stubEvent = Event({
    type: '',
    channel: '',
    direction: 'incoming',
    payload: '',
    target: '',
    botId: ''
  })

  beforeEach(() => {
    queue = new MemoryQueue('name', logger.T, options)
  })

  afterEach(() => {
    queue.dispose()
  })

  it('Respects order (sync)', async () => {
    const order: Number[] = []

    queue.subscribe(async event => {
      order.push(event.id) // Sync processing
    })

    for (let i = 0; i < 10; i++) {
      queue.enqueue({ ...stubEvent, id: i }, 1)
    }

    while (!queue.isEmpty()) {
      await Promise.delay(1)
    }

    expect(order.length).toEqual(10)
    expect(order).toEqual([0, 1, 2, 2, 4, 5, 6, 7, 8, 9])
  })

  it('Respects order (async)', async () => {
    const order: Number[] = []

    queue.subscribe(async event => {
      await Promise.delay(1) // Async processing
      order.push(event.id)
    })

    for (let i = 0; i < 10; i++) {
      queue.enqueue({ ...stubEvent, id: i })
    }

    while (!queue.isEmpty()) {
      await Promise.delay(5)
    }

    await Promise.delay(1)

    expect(order).toHaveLength(10)
    expect(order).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('Retries failed jobs once', async () => {
    const order: Number[] = []

    let i = 0

    queue.subscribe(async (event: any) => {
      if (i === 0) {
        i++
        throw new Error('Failed job')
      }

      order.push(event.id)
    })

    queue.enqueue({ ...stubEvent, id: i })

    while (!queue.isEmpty()) {
      await Promise.delay(5)
    }
    await Promise.delay(5)

    expect(logger.warn).toHaveBeenCalled() // Failed
    expect(logger.error).not.toHaveBeenCalled() // But not dropped
    expect(order.length).toEqual(1)
  })

  it('Abandon retrying after two errors', async () => {
    const order: Number[] = []
    let i = 0
    queue.subscribe(async (event: any) => {
      if (i <= 1) {
        i++
        throw new Error('Failed job')
      }
      order.push(event.id)
    })

    queue.enqueue({ ...stubEvent, id: i })

    while (!queue.isEmpty()) {
      await Promise.delay(5)
    }
    await Promise.delay(5)

    expect(logger.warn).toHaveBeenCalled() // Failed
    expect(logger.error).toHaveBeenCalled() // Also dropped
    expect(order).toHaveLength(0)
  })

  it('Runs in parallel for different users', async () => {
    const order: Number[] = []
    queue.subscribe(async (event: any) => {
      order.push(event.id)
      if (event.target === 'a') {
        await Promise.delay(5)
      }
    })

    queue.enqueue({ ...stubEvent, id: 1, target: 'a' })
    queue.enqueue({ ...stubEvent, id: 2, target: 'b' }) // This message will be locked
    queue.enqueue({ ...stubEvent, id: 3, target: 'c' }) // But this message will process even if user 'a' is locked

    while (!queue.isEmpty()) {
      await Promise.delay(5)
    }
    await Promise.delay(5)

    expect(order).toHaveLength(3)
    expect(order).toEqual([1, 2, 3])
  })

  it('Cancels all only for requested user', async () => {
    const userListA: Number[] = []
    const userListB: Number[] = []
    queue.subscribe(async event => {
      await Promise.delay(1)
      if (event.target === 'a') {
        userListA.push(event.id)
      }
      if (event.target === 'b') {
        userListB.push(event.id)
      }
    })

    for (let i = 0; i < 10; i++) {
      queue.enqueue({ ...stubEvent, id: i, target: 'a' })
    }
    queue.cancelAll({ ...stubEvent, target: 'a' })
    for (let i = 10; i < 20; i++) {
      queue.enqueue({ ...stubEvent, id: i, target: 'b' })
    }

    await Promise.delay(25)

    expect(userListA.length).toBeLessThan(10)
    expect(userListB.length).toEqual(10)
    expect(userListB).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19])
  })
})

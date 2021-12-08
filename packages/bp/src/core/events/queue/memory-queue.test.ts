// eslint-disable  @typescript-eslint/no-floating-promises

import 'bluebird-global'
import { IO } from 'botpress/sdk'
import _ from 'lodash'
import 'reflect-metadata'

import { Event } from '../event-sdk-impl'
import { createMockLogger } from '../../misc/utils'

import { MemoryQueue } from './memory-queue'

describe('Lite Queues', () => {
  const options = { retries: 1 }
  const logger = createMockLogger()
  let queue: MemoryQueue<IO.Event>

  const stubEvent = Event({
    type: '',
    channel: '',
    direction: 'incoming',
    payload: '',
    target: '',
    botId: ''
  })

  beforeEach(() => {
    queue = new MemoryQueue('name', logger, options)
  })

  afterEach(() => {
    queue.dispose()
  })

  it('Respects order (sync)', async () => {
    const order: string[] = []

    queue.subscribe(async event => {
      order.push(event.id) // Sync processing
    })

    for (let i = 0; i < 10; i++) {
      queue.enqueue({ ...stubEvent, id: i.toString() })
    }

    while (!queue.isEmpty()) {
      await Promise.delay(1)
    }

    await Promise.delay(10) // Give time for subscription to be consumed
    expect(order.length).toEqual(10)
    expect(order).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => n.toString()))
  })

  it('Respects order (async)', async () => {
    const order: string[] = []

    queue.subscribe(async event => {
      await Promise.delay(Math.random() * 5) // Async processing
      order.push(event.id.toString())
    })

    for (let i = 0; i < 10; i++) {
      queue.enqueue({ ...stubEvent, id: i.toString() })
    }

    while (!queue.isEmpty()) {
      await Promise.delay(5)
    }

    await Promise.delay(20) // Give time for subscription to be consumed
    expect(order).toHaveLength(10)
    expect(order).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(x => x.toString()))
  })

  it('Retries failed jobs once', async () => {
    const order: string[] = []

    let i = 0

    queue.subscribe(async (event: any) => {
      if (i === 0) {
        i++
        throw new Error('Failed job')
      }

      order.push(event.id)
    })

    queue.enqueue({ ...stubEvent, id: i.toString() })

    while (!queue.isEmpty()) {
      await Promise.delay(5)
    }

    await Promise.delay(20)
    expect(logger.warn).toHaveBeenCalled() // Failed
    expect(logger.error).not.toHaveBeenCalled() // But not dropped
    expect(order.length).toEqual(1)
  })

  it('Abandon retrying after two errors', async () => {
    const order: string[] = []
    let i = 0
    queue.subscribe(async (event: any) => {
      if (i <= 1) {
        i++
        throw new Error('Failed job')
      }
      order.push(event.id)
    })

    queue.enqueue({ ...stubEvent, id: i.toString() })

    while (!queue.isEmpty()) {
      await Promise.delay(5)
    }
    await Promise.delay(20)

    expect(logger.warn).toHaveBeenCalled() // Failed
    expect(logger.error).toHaveBeenCalled() // Also dropped
    expect(order).toHaveLength(0)
  })

  it('Runs in parallel for different users', async () => {
    const order: string[] = []
    queue.subscribe(async (event: any) => {
      order.push(event.id)
      if (event.target === 'a') {
        await Promise.delay(5)
      }
    })

    queue.enqueue({ ...stubEvent, id: '1', target: 'a' })
    queue.enqueue({ ...stubEvent, id: '2', target: 'b' }) // This message will be locked
    queue.enqueue({ ...stubEvent, id: '3', target: 'c' }) // But this message will process even if user 'a' is locked

    while (!queue.isEmpty()) {
      await Promise.delay(5)
    }

    await Promise.delay(20)
    expect(order).toHaveLength(3)
    expect(order).toEqual([1, 2, 3].map(x => x.toString()))
  })

  it('Cancels all only for requested user', async () => {
    const userListA: string[] = []
    const userListB: string[] = []
    queue.subscribe(async event => {
      await Promise.delay(1)
      if (event.target === 'a') {
        userListA.push(event.id)
      }
      if (event.target === 'b') {
        userListB.push(event.id)
      }
    })

    // Enqueue jobs that takes ~ 1ms to execute
    for (let i = 0; i < 10; i++) {
      queue.enqueue({ ...stubEvent, id: i.toString(), target: 'a' })
    }

    // Cancel remaining jobs for target a
    queue.cancelAll({ ...stubEvent, target: 'a' })

    // Enqueue jobs for target b
    for (let i = 10; i < 20; i++) {
      queue.enqueue({ ...stubEvent, id: i.toString(), target: 'b' })
    }

    /**
     *  Make sure all jobs are executed
     *  Promise.delay(1) sometimes delays for more than that (10-20ms) which fails this test
     */
    await Promise.delay(200)
    expect(userListA.length).toBeLessThan(10)
    expect(userListB.length).toEqual(10)
    expect(userListB).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map(x => x.toString()))
  })
})

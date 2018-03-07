/* eslint-env babel-eslint, node, mocha */

import sinon from 'sinon'
import { expect } from 'chai'
import Promise from 'bluebird'
import _ from 'lodash'

import Queue from '../queue'

describe('Lite Queues', () => {
  const options = { retries: 1 }
  let logger, queue

  beforeEach('Setup queue', () => {
    logger = { warn: sinon.spy(), error: sinon.spy() }
    queue = new Queue('name', logger, options)
  })

  it('Respects order (sync)', async () => {
    const order = []

    queue.subscribe(event => {
      order.push(event.id) // Sync processing
    })

    for (let i = 0; i < 10; i++) {
      queue.enqueue({ userId: 'a', id: i })
    }

    while (queue.queue.length) {
      await Promise.delay(1)
    }

    expect(order).to.length(10)
    expect(order).to.deep.equal([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('Respects order (async)', async () => {
    const order = []

    queue.subscribe(async event => {
      await Promise.delay(1) // Async processing
      order.push(event.id)
    })

    for (let i = 0; i < 10; i++) {
      queue.enqueue({ userId: 'a', id: i })
    }

    while (queue.queue.length) {
      await Promise.delay(5)
    }

    await Promise.delay(1)

    expect(order).to.length(10)
    expect(order).to.deep.equal([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('Retries failed jobs once', async () => {
    const order = []

    let i = 0

    queue.subscribe(async event => {
      if (i === 0) {
        i++
        throw new Error('Failed job')
      }

      order.push(event.id)
    })

    queue.enqueue({ userId: 'a', id: 1 })

    while (queue.queue.length) {
      await Promise.delay(5)
    }
    await Promise.delay(5)

    expect(logger.warn.called).to.equal(true) // Failed
    expect(logger.error.called).to.equal(false) // But not dropped

    expect(order).to.length(1)
  })

  it('Abandon retrying after two errors', async () => {
    const order = []
    let i = 0
    queue.subscribe(async event => {
      if (i <= 1) {
        i++
        throw new Error('Failed job')
      }
      order.push(event.id)
    })

    queue.enqueue({ userId: 'a', id: 1 })

    while (queue.queue.length) {
      await Promise.delay(5)
    }
    await Promise.delay(5)

    expect(logger.warn.called).to.equal(true) // Failed
    expect(logger.error.called).to.equal(true) // Also dropped

    expect(order).to.length(0)
  })

  it('Runs in parallel for different users', async () => {
    const order = []
    queue.subscribe(async event => {
      order.push(event.id)
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

    expect(order).to.length(3)
    expect(order).to.deep.equal([1, 2, 3])
  })

  it('Cancels all only for requested user', async () => {
    const userListA = []
    const userListB = []
    queue.subscribe(async event => {
      await Promise.delay(1)
      if (event.userId === 'a') {
        userListA.push(event.id)
      }
      if (event.userId === 'b') {
        userListB.push(event.id)
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

    expect(userListA).to.length.below(10)
    expect(userListB).to.length(10)
    expect(userListB).to.deep.equal([10, 11, 12, 13, 14, 15, 16, 17, 18, 19])
  })
})

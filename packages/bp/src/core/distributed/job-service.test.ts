import 'bluebird-global'
import 'jest-extended'
import 'reflect-metadata'

import { CEJobService } from './job-service'

describe('Lock', () => {
  const jobService = new CEJobService()
  const resourceName = 'testLock'

  /** Duration must be longer since tests are executing with Redis enabled */
  const DURATION = 200

  beforeEach(async () => {
    try {
      await jobService.clearLock(resourceName)
    } catch (err) {}
  })

  it('Obtain a lock ', async () => {
    const lock = await jobService.acquireLock(resourceName, DURATION)
    expect(lock).not.toBeUndefined()

    await lock?.unlock()
  })

  it('Try to obtain a second lock', async () => {
    const lock = await jobService.acquireLock(resourceName, DURATION)
    expect(lock).not.toBeUndefined()

    const lock2 = await jobService.acquireLock(resourceName, DURATION)
    expect(lock2).toBeUndefined()
  })

  it('Obtain a second lock, after clearing the previous one', async () => {
    const lock = await jobService.acquireLock(resourceName, DURATION)
    expect(lock).not.toBeUndefined()

    await jobService.clearLock(resourceName)

    const lock2 = await jobService.acquireLock(resourceName, DURATION)
    expect(lock2).not.toBeUndefined()
  })

  it('Test lock expiration', async () => {
    const lock = await jobService.acquireLock(resourceName, DURATION)
    expect(lock).not.toBeUndefined()

    await Promise.delay(DURATION * 2)

    const lock2 = await jobService.acquireLock(resourceName, DURATION)
    expect(lock2).not.toBeUndefined()
  })

  it('Extend the duration of the lock', async () => {
    const lock = await jobService.acquireLock(resourceName, DURATION)
    expect(lock).not.toBeUndefined()

    await lock?.extend(DURATION * 3)
    await Promise.delay(DURATION * 2)

    const lock2 = await jobService.acquireLock(resourceName, DURATION)
    expect(lock2).toBeUndefined()
  })
})

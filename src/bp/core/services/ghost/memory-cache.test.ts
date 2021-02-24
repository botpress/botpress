import 'bluebird-global'
import 'reflect-metadata'

import LRU from 'lru-cache'
import sizeof from 'object-sizeof'

import { createSpyObject, MockObject } from '../../misc/utils'

import { ObjectCache } from 'common/object-cache'
import MemoryObjectCache, { EVENTS } from './memory-cache'
import { CacheInvalidators } from './cache-invalidators'

const AN_INVALID_KEY = 'invalid key'
const A_KEY = 'key'
const ANOTHER_KEY = 'another key'
const A_VALUE = 'a value'
const AN_OBJECT_VALUE = { key: 'value' }
const HUGE_OBJECT_VALUE = Array.from({ length: 40 }, () => Math.floor(Math.random() * 40).toString())
const MAX_CACHE_SIZE = 24 // MAX_CACHE_SIZE must be less than the size of HUGE_OBJECT_VALUE
const SYNC_MESSAGE = 'a message'

describe('Memory Cache', () => {
  let cache: ObjectCache
  let cacheInvalidator: MockObject<CacheInvalidators.FileChangedInvalidator>
  let assertCacheIsEmpty: () => void

  beforeEach(() => {
    const defaultCacheValue = process.core_env.BP_MAX_MEMORY_CACHE_SIZE
    ;(process.core_env.BP_MAX_MEMORY_CACHE_SIZE as string) = `${MAX_CACHE_SIZE}b`

    cacheInvalidator = createSpyObject<CacheInvalidators.FileChangedInvalidator>()
    cache = new MemoryObjectCache(cacheInvalidator.T)
    ;(process.core_env.BP_MAX_MEMORY_CACHE_SIZE as string | undefined) = defaultCacheValue

    assertCacheIsEmpty = () => expect(cache['cache'].itemCount).toEqual(0)
  })

  describe('Initialize', () => {
    it('LRU cache is initialized properly', () => {
      const lru = cache['cache'] as LRU<string, any>

      expect(lru).not.toBeUndefined()
      expect(lru.max).toEqual(MAX_CACHE_SIZE)
    })

    it('Event emitter is instantiated properly', () => {
      const emitter = cache.events
      emitter.listenerCount

      expect(emitter).not.toBeUndefined()
      expect(emitter.eventNames().length).toEqual(0)
    })

    it('CacheInvalidator is installed properly', () => {
      expect(cacheInvalidator.install).toHaveBeenCalledTimes(1)
    })
  })

  describe('Set', () => {
    beforeEach(async () => {
      await cache.invalidate(A_KEY)
      assertCacheIsEmpty()
    })

    it('Caches any type of value', async () => {
      const values = [[], null, undefined, '', 0, 0.0, true, {}, () => {}]

      for (const value of values) {
        await cache.set(A_KEY, value)

        expect(await cache.get(A_KEY)).toEqual(value)
        expect(typeof (await cache.get(A_KEY))).toEqual(typeof value)
      }
    })

    it('Does not cache a value which size is bigger then the size of the cache', async () => {
      const callback = jest.fn()
      cache.events.on(EVENTS.invalidation, key => callback(key))

      expect(sizeof(HUGE_OBJECT_VALUE) > MAX_CACHE_SIZE).toEqual(true)

      await cache.set(A_KEY, HUGE_OBJECT_VALUE)

      expect(await cache.has(A_KEY)).toEqual(false)

      expect(callback).not.toHaveBeenCalled()
    })

    it('Removes a key that is being overridden if the value size is bigger then the size of the cache', async () => {
      const callback = jest.fn()
      cache.events.on(EVENTS.invalidation, key => callback(key))

      expect(sizeof(HUGE_OBJECT_VALUE) > MAX_CACHE_SIZE).toEqual(true)

      await cache.set(A_KEY, A_VALUE)
      await cache.set(A_KEY, HUGE_OBJECT_VALUE)

      expect(await cache.has(A_KEY)).toEqual(false)

      expect(callback).not.toHaveBeenCalled()
    })

    it('Overrides the value when a new one is provided', async () => {
      await cache.set(A_KEY, A_VALUE)
      expect(await cache.get(A_KEY)).toEqual(A_VALUE)

      await cache.set(A_KEY, AN_OBJECT_VALUE)
      expect(await cache.get(A_KEY)).toEqual(AN_OBJECT_VALUE)
    })

    it(`Emits an ${EVENTS.invalidation} event when a value is overridden`, async () => {
      const callback = jest.fn()
      cache.events.on(EVENTS.invalidation, key => callback(key))

      await cache.set(A_KEY, A_VALUE)
      expect(await cache.get(A_KEY)).toEqual(A_VALUE)

      await cache.set(A_KEY, AN_OBJECT_VALUE)
      expect(await cache.get(A_KEY)).toEqual(AN_OBJECT_VALUE)

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(A_KEY)
    })

    it(`Does not emit an ${EVENTS.invalidation} event when no value is overridden`, async () => {
      const callback = jest.fn()
      cache.events.on(EVENTS.invalidation, key => callback(key))

      await cache.set(A_KEY, A_VALUE)
      expect(await cache.get(A_KEY)).toEqual(A_VALUE)

      expect(callback).not.toHaveBeenCalled()
    })

    it(`Does not emit an ${EVENTS.invalidation} event if the key was not inserted into the cache`, async () => {
      const callback = jest.fn()
      cache.events.on(EVENTS.invalidation, key => callback(key))

      expect(sizeof(HUGE_OBJECT_VALUE) > MAX_CACHE_SIZE).toEqual(true)

      await cache.set(A_KEY, A_VALUE)
      await cache.set(A_KEY, HUGE_OBJECT_VALUE)

      expect(await cache.has(A_KEY)).toEqual(false)

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('Invalidate', () => {
    it('Does nothing if the cache is empty', async () => {
      assertCacheIsEmpty()

      await cache.invalidate(A_KEY)

      assertCacheIsEmpty()
    })

    it('Removes the proper value from the cache', async () => {
      assertCacheIsEmpty()

      await cache.set(A_KEY, A_VALUE)
      expect(await cache.has(A_KEY)).toEqual(true)

      await cache.set(ANOTHER_KEY, AN_OBJECT_VALUE)
      expect(await cache.has(ANOTHER_KEY)).toEqual(true)

      await cache.invalidate(A_KEY)
      expect(await cache.has(A_KEY)).toEqual(false)

      expect(await cache.has(ANOTHER_KEY)).toEqual(true)
    })

    it(`Emits an ${EVENTS.invalidation} event when a value is removed`, async () => {
      const callback = jest.fn()
      cache.events.on(EVENTS.invalidation, key => callback(key))

      await cache.set(A_KEY, A_VALUE)
      expect(await cache.has(A_KEY)).toEqual(true)

      await cache.invalidate(A_KEY)
      expect(await cache.has(A_KEY)).toEqual(false)

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(A_KEY)
    })

    it(`Does not emit an ${EVENTS.invalidation} event when no value is removed`, async () => {
      const callback = jest.fn()
      cache.events.on(EVENTS.invalidation, key => callback(key))

      await cache.invalidate(A_KEY)
      expect(await cache.has(A_KEY)).toEqual(false)

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('Get', () => {
    it('Returns undefined when the cache is empty', async () => {
      assertCacheIsEmpty()

      expect(await cache.get(A_KEY)).toBeUndefined()
    })

    it('Returns undefined if the key does not exist', async () => {
      await cache.set(A_KEY, A_VALUE)

      expect(await cache.get(AN_INVALID_KEY)).toBeUndefined()
      expect(await cache.get(A_KEY)).toEqual(A_VALUE)
    })

    it('Returns the object value from the cache', async () => {
      await cache.set(A_KEY, AN_OBJECT_VALUE)

      expect(typeof (await cache.get<typeof AN_OBJECT_VALUE>(A_KEY))).toBe(typeof AN_OBJECT_VALUE)
      expect(await cache.get<typeof AN_OBJECT_VALUE>(A_KEY)).toEqual(AN_OBJECT_VALUE)
    })
  })

  describe('Has', () => {
    beforeEach(async () => {
      await cache.invalidate(A_KEY)
      expect(await cache.has(A_KEY)).toEqual(false)
    })

    it('Returns false when the cache is empty', async () => {
      assertCacheIsEmpty()

      expect(await cache.has(A_KEY)).toEqual(false)
    })

    it('Returns false if the key does not exist', async () => {
      await cache.set(A_KEY, A_VALUE)

      expect(await cache.has(AN_INVALID_KEY)).toEqual(false)
      expect(await cache.has(A_KEY)).toEqual(true)
    })

    it('Returns true when the key exist', async () => {
      await cache.set(A_KEY, AN_OBJECT_VALUE)

      expect(await cache.has(A_KEY)).toEqual(true)
    })
  })

  describe('Sync', () => {
    it(`Emits an ${EVENTS.syncDbFilesToDisk} event with a message`, async () => {
      const callback = jest.fn()
      cache.events.on(EVENTS.syncDbFilesToDisk, key => callback(key))

      await cache.sync(SYNC_MESSAGE)

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(SYNC_MESSAGE)
    })
  })

  describe('InvalidateStartingWith', () => {
    it('Does nothing if the cache is empty', async () => {
      assertCacheIsEmpty()

      await cache.invalidateStartingWith(A_KEY)

      assertCacheIsEmpty()
    })

    it('Removes every key that starts with a given prefix', async () => {
      assertCacheIsEmpty()

      // TODO: Use values from constant/utils file instead
      const bufferKey = `buffer::${A_KEY}`
      const objectKey = `object::${A_KEY}`
      const stringKey = `string::${A_KEY}`
      const keys = [bufferKey, objectKey, stringKey]

      for (const key of keys) {
        await cache.set(key, A_VALUE)
        expect(await cache.has(key)).toEqual(true)
      }

      await cache.set(ANOTHER_KEY, AN_OBJECT_VALUE)
      expect(await cache.has(ANOTHER_KEY)).toEqual(true)

      await cache.invalidateStartingWith(A_KEY)

      for (const key of keys) {
        expect(await cache.has(key)).toEqual(false)
      }
      expect(await cache.has(ANOTHER_KEY)).toEqual(true)
    })
  })
})

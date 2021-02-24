import 'bluebird-global'
import 'reflect-metadata'
import 'jest-extended'

import LRU from 'lru-cache'
import sizeof from 'object-sizeof'

import { createSpyObject, MockObject, asBytes } from '../../misc/utils'

import { ObjectCache } from 'common/object-cache'
import MemoryObjectCache, { EVENTS } from './memory-cache'
import { CacheInvalidators } from './cache-invalidators'

const AN_INVALID_KEY = 'invalid key'
const A_KEY = 'key'
const ANOTHER_KEY = 'another key'
const A_VALUE = 'a value'
const AN_OBJECT_VALUE = { key: 'value' }
const HUGE_OBJECT_VALUE = Array.from({ length: 40 }, () => Math.floor(Math.random() * 40).toString())
const MAX_CACHE_SIZE = 50 // MAX_CACHE_SIZE must be less than the size of HUGE_OBJECT_VALUE
const SYNC_MESSAGE = 'a message'

const OLD_BP_MAX_MEMORY_CACHE_SIZE = process.env.BP_MAX_MEMORY_CACHE_SIZE

describe('Memory Cache', () => {
  let cache: ObjectCache
  let cacheInvalidator: MockObject<CacheInvalidators.FileChangedInvalidator>
  let assertCacheIsEmpty: () => void
  let emptyCache: () => void

  beforeEach(() => {
    process.env.BP_MAX_MEMORY_CACHE_SIZE = `${MAX_CACHE_SIZE}b`

    cacheInvalidator = createSpyObject<CacheInvalidators.FileChangedInvalidator>()
    cache = new MemoryObjectCache(cacheInvalidator.T)

    assertCacheIsEmpty = () => {
      const lru = cache['cache'] as LRU<string, any>

      expect(lru.itemCount).toEqual(0)
      expect(lru.length).toEqual(0)
    }

    emptyCache = () => {
      const lru = cache['cache'] as LRU<string, any>

      lru.reset()
    }
  })

  afterAll(() => {
    process.env.BP_MAX_MEMORY_CACHE_SIZE = OLD_BP_MAX_MEMORY_CACHE_SIZE
  })

  describe('Initialize', () => {
    it('LRU cache is initialized properly', () => {
      const lru = cache['cache'] as LRU<string, any>

      expect(lru).not.toBeUndefined()
      expect(lru.max).toEqual(MAX_CACHE_SIZE)
      expect(lru.lengthCalculator).toEqual(sizeof)
      expect(lru.length).toEqual(0)
      expect(lru.itemCount).toEqual(0)
    })

    it('LRU cache is initialized with default max size', () => {
      delete process.env.BP_MAX_MEMORY_CACHE_SIZE
      cache = new MemoryObjectCache(cacheInvalidator.T)
      const lru = cache['cache'] as LRU<string, any>

      expect(lru).not.toBeUndefined()
      expect(lru.max).toEqual(asBytes(MemoryObjectCache.DEFAULT_MAX_MEMORY_CACHE_SIZE))
      expect(lru.lengthCalculator).toEqual(sizeof)
      expect(lru.length).toEqual(0)
      expect(lru.itemCount).toEqual(0)
    })

    it('Event emitter is instantiated properly', () => {
      const emitter = cache.events
      emitter.listenerCount

      expect(emitter).not.toBeUndefined()
      // No listeners are registered
      expect(emitter.eventNames().length).toEqual(0)
    })

    it('CacheInvalidator is installed properly', () => {
      expect(cacheInvalidator.install).toHaveBeenCalledTimes(1)
      expect(cacheInvalidator.install).toHaveBeenCalledWith(cache)
    })
  })

  describe('Set', () => {
    beforeEach(() => {
      emptyCache()
    })

    it('Caches any type of values', () => {
      const values = [[], null, undefined, '', 0, 0.0, true, {}, () => {}]

      for (const value of values) {
        cache.set(A_KEY, value)

        expect(cache.get(A_KEY)).toEqual(value)
        expect(typeof cache.get(A_KEY)).toEqual(typeof value)
      }
    })

    it('Does not cache a value which size is bigger then the size of the cache', () => {
      const callback = jest.fn()
      cache.events.on(EVENTS.invalidation, key => callback(key))

      expect(sizeof(HUGE_OBJECT_VALUE) > MAX_CACHE_SIZE).toBeTrue()

      cache.set(A_KEY, HUGE_OBJECT_VALUE)

      expect(cache.has(A_KEY)).toBeFalse()

      expect(callback).not.toHaveBeenCalled()
    })

    it('Removes a key that is being overridden if the value size is bigger then the size of the cache', () => {
      const callback = jest.fn()
      cache.events.on(EVENTS.invalidation, key => callback(key))

      expect(sizeof(HUGE_OBJECT_VALUE) > MAX_CACHE_SIZE).toBeTrue()

      cache.set(A_KEY, A_VALUE)
      cache.set(A_KEY, HUGE_OBJECT_VALUE)

      expect(cache.has(A_KEY)).toBeFalse()

      expect(callback).not.toHaveBeenCalled()
    })

    it('Overrides the value when a new one is provided', () => {
      cache.set(A_KEY, A_VALUE)
      expect(cache.get(A_KEY)).toEqual(A_VALUE)

      cache.set(A_KEY, AN_OBJECT_VALUE)
      expect(cache.get(A_KEY)).toEqual(AN_OBJECT_VALUE)
    })

    it(`Emits an ${EVENTS.invalidation} event when a value is overridden`, () => {
      const callback = jest.fn()
      cache.events.on(EVENTS.invalidation, key => callback(key))

      cache.set(A_KEY, A_VALUE)
      expect(cache.get(A_KEY)).toEqual(A_VALUE)

      cache.set(A_KEY, AN_OBJECT_VALUE)
      expect(cache.get(A_KEY)).toEqual(AN_OBJECT_VALUE)

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(A_KEY)
    })

    it(`Does not emit an ${EVENTS.invalidation} event when no value is overridden`, () => {
      const callback = jest.fn()
      cache.events.on(EVENTS.invalidation, key => callback(key))

      cache.set(A_KEY, A_VALUE)
      expect(cache.get(A_KEY)).toEqual(A_VALUE)

      expect(callback).not.toHaveBeenCalled()
    })

    it(`Does not emit an ${EVENTS.invalidation} event if the key was not inserted into the cache`, () => {
      const callback = jest.fn()
      cache.events.on(EVENTS.invalidation, key => callback(key))

      expect(sizeof(HUGE_OBJECT_VALUE) > MAX_CACHE_SIZE).toBeTrue()

      cache.set(A_KEY, A_VALUE)
      cache.set(A_KEY, HUGE_OBJECT_VALUE)

      expect(cache.has(A_KEY)).toBeFalse()

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('Invalidate', () => {
    beforeEach(() => {
      assertCacheIsEmpty()
    })

    it('Does nothing if the cache is empty', async () => {
      try {
        await cache.invalidate(A_KEY)

        assertCacheIsEmpty()
      } catch (e) {
        fail(e)
      }
    })

    it('Removes the proper value from the cache', async () => {
      cache.set(A_KEY, A_VALUE)
      expect(cache.has(A_KEY)).toBeTrue()

      cache.set(ANOTHER_KEY, AN_OBJECT_VALUE)
      expect(cache.has(ANOTHER_KEY)).toBeTrue()

      await cache.invalidate(A_KEY)
      expect(cache.has(A_KEY)).toBeFalse()

      expect(cache.has(ANOTHER_KEY)).toBeTrue()
    })

    it(`Emits an ${EVENTS.invalidation} event when a value is removed`, async () => {
      const callback = jest.fn()
      cache.events.on(EVENTS.invalidation, key => callback(key))

      cache.set(A_KEY, A_VALUE)
      expect(cache.has(A_KEY)).toBeTrue()

      await cache.invalidate(A_KEY)
      expect(cache.has(A_KEY)).toBeFalse()

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(A_KEY)
    })

    it(`Does not emit an ${EVENTS.invalidation} event when no value is removed`, async () => {
      const callback = jest.fn()
      cache.events.on(EVENTS.invalidation, key => callback(key))

      expect(cache.has(A_KEY)).toBeFalse()
      await cache.invalidate(A_KEY)
      expect(cache.has(A_KEY)).toBeFalse()

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('Get', () => {
    it('Returns undefined when the cache is empty', () => {
      assertCacheIsEmpty()

      expect(cache.get(A_KEY)).toBeUndefined()
    })

    it('Returns undefined if the key does not exist', () => {
      cache.set(A_KEY, A_VALUE)

      expect(cache.has(AN_INVALID_KEY)).toBeFalse()
      expect(cache.has(A_KEY)).toBeTrue()

      expect(cache.get(AN_INVALID_KEY)).toBeUndefined()
      expect(cache.get(A_KEY)).toEqual(A_VALUE)
    })

    it('Returns the object value from the cache', () => {
      cache.set(A_KEY, AN_OBJECT_VALUE)

      expect(typeof cache.get<typeof AN_OBJECT_VALUE>(A_KEY)).toBe(typeof AN_OBJECT_VALUE)
      expect(cache.get<typeof AN_OBJECT_VALUE>(A_KEY)).toEqual(AN_OBJECT_VALUE)
    })
  })

  describe('Has', () => {
    beforeEach(() => {
      emptyCache()
    })

    it('Returns false when the cache is empty', () => {
      assertCacheIsEmpty()

      expect(cache.has(A_KEY)).toBeFalse()
    })

    it('Returns false if the key does not exist', () => {
      cache.set(A_KEY, A_VALUE)

      expect(cache.has(AN_INVALID_KEY)).toBeFalse()
      expect(cache.has(A_KEY)).toBeTrue()
    })

    it('Returns true when the key exist', () => {
      cache.set(A_KEY, AN_OBJECT_VALUE)

      expect(cache.has(A_KEY)).toBeTrue()
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
    beforeEach(() => {
      emptyCache()
    })

    it('Does nothing if the cache is empty', async () => {
      try {
        await cache.invalidateStartingWith(A_KEY)

        assertCacheIsEmpty()
      } catch (e) {
        fail(e)
      }
    })

    it('Removes every keys that starts with a given prefix', async () => {
      // TODO: Use values from constant/utils file instead
      const bufferKey = `buffer::${A_KEY}`
      const objectKey = `object::${A_KEY}`
      const stringKey = `string::${A_KEY}`
      const keys = [bufferKey, objectKey, stringKey]

      expect(sizeof(A_VALUE) * keys.length <= MAX_CACHE_SIZE).toBeTrue()

      for (const key of keys) {
        cache.set(key, A_VALUE)
      }

      for (const key of keys) {
        expect(cache.has(key)).toBeTrue()
      }

      cache.set(ANOTHER_KEY, AN_OBJECT_VALUE)
      expect(cache.has(ANOTHER_KEY)).toBeTrue()

      await cache.invalidateStartingWith(A_KEY)

      for (const key of keys) {
        expect(cache.has(key)).toBeFalse()
      }

      expect(cache.has(ANOTHER_KEY)).toBeTrue()
    })
  })
})

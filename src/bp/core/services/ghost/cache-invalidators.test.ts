import 'bluebird-global'
import 'reflect-metadata'
import 'jest-extended'

import chokidar from 'chokidar'

jest.mock('chokidar', () => ({
  watch: jest.fn(() => ({
    on: jest.fn(function(this: any) {
      return this
    })
  }))
}))

import { createSpyObject, MockObject } from '../../misc/utils'

import { join, dirname } from 'path'

import { ObjectCache } from 'common/object-cache'
import MemoryObjectCache from './memory-cache'
import { CacheInvalidators } from './cache-invalidators'
import { PersistedConsoleLogger } from 'core/logger'
import { EventEmitter } from 'events'

const FILE_RELATIVE = 'test/subfolder/file.file'
const FILE = join(process.cwd(), FILE_RELATIVE)
const FILE_PATH = dirname(FILE_RELATIVE)
const BACKSLASH_FILE = FILE.replace(/\//g, '\\\\')

describe('Cache Invalidators', () => {
  const OLD_PROJECT_LOCATION = process.PROJECT_LOCATION

  describe('File Changed Invalidator', () => {
    let cacheInvalidator: CacheInvalidators.FileChangedInvalidator
    let memoryCache: MockObject<ObjectCache>, logger: MockObject<PersistedConsoleLogger>

    beforeEach(() => {
      process.PROJECT_LOCATION = process.cwd()

      memoryCache = createSpyObject<MemoryObjectCache>()
      logger = createSpyObject<PersistedConsoleLogger>()
      logger.attachError.mockReturnValue(logger)

      cacheInvalidator = new CacheInvalidators.FileChangedInvalidator(logger.T)
    })

    afterAll(() => {
      process.PROJECT_LOCATION = OLD_PROJECT_LOCATION
    })

    describe('Initialize', () => {
      it('Logger is initialized properly', () => {
        const logger = cacheInvalidator['logger'] as PersistedConsoleLogger

        expect(logger).not.toBeUndefined()
      })

      it('Cache and watcher are undefined', () => {
        const cache = cacheInvalidator['cache'] as ObjectCache
        const watcher = cacheInvalidator['watcher'] as chokidar.FSWatcher

        expect(cache).toBeUndefined()
        expect(watcher).toBeUndefined()
      })
    })

    describe('Install', () => {
      it('Does nothing if no cache is passed as argument', () => {
        cacheInvalidator.install(null as any)

        const cache = cacheInvalidator['cache'] as ObjectCache
        const watcher = cacheInvalidator['watcher'] as chokidar.FSWatcher

        expect(cache).toBeUndefined()
        expect(watcher).toBeUndefined()
      })

      it('Configures the watcher properly', () => {
        cacheInvalidator.install(memoryCache.T)

        const cache = cacheInvalidator['cache'] as ObjectCache
        const watcher = cacheInvalidator['watcher'] as chokidar.FSWatcher
        const handle = cacheInvalidator['_handle']

        expect(cache).not.toBeUndefined()
        expect(watcher).not.toBeUndefined()

        expect(chokidar.watch).toHaveBeenCalledTimes(1)
        expect(watcher.on).toHaveBeenCalledAfter(chokidar.watch as jest.Mock)
        expect(watcher.on).toHaveBeenCalled() // We don't care how many time it has been called
        expect(watcher.on).toHaveBeenCalledWith(expect.anything(), handle)
      })
    })

    describe('RelativePath', () => {
      it('Replaces back slashes with forward slashes', () => {
        const relativePath = cacheInvalidator['_relativePath']

        const path = relativePath(BACKSLASH_FILE)

        expect(path.match(/\\$/)).toEqual(null)
      })

      it('Starts with process.PROJECT_LOCATION', () => {
        const relativePath = cacheInvalidator['_relativePath']

        const path = relativePath(FILE)

        expect(path).toEqual(FILE_PATH)
      })
    })

    describe('Handle', () => {
      it('Does nothing if no cache was configured', async () => {
        cacheInvalidator.install(null as any)

        const handle = cacheInvalidator['_handle']

        await handle(FILE)

        expect(memoryCache.invalidateStartingWith).not.toHaveBeenCalled()
      })

      it('Calls cache.invalidateStartingWith with the proper path', async () => {
        Object.defineProperty(memoryCache, 'events', { get: () => new EventEmitter() })

        cacheInvalidator.install(memoryCache.T)

        const handle = cacheInvalidator['_handle']
        const relativePath = cacheInvalidator['_relativePath']

        await handle(FILE)

        expect(memoryCache.invalidateStartingWith).toHaveBeenCalledTimes(1)
        expect(memoryCache.invalidateStartingWith).toHaveBeenCalledWith(relativePath(FILE))
      })
    })
  })
})

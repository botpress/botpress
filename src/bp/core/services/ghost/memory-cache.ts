import { ObjectCache } from 'common/object-cache'
import { asBytes } from 'core/misc/utils'
import { EventEmitter } from 'events'
import { inject, injectable } from 'inversify'
import LRU from 'lru-cache'
import sizeof from 'object-sizeof'

import { TYPES } from '../../types'

import { CacheInvalidators } from './cache-invalidators'

export const EVENTS = {
  invalidation: 'invalidation',
  syncDbFilesToDisk: 'syncDbFilesToDisk'
}

// TODO: Handle objects with size > than LRU max size + items that are removed from the cache when it's full
@injectable()
export default class MemoryObjectCache implements ObjectCache {
  private cache: LRU<string, any>

  public readonly events: EventEmitter = new EventEmitter()
  public static readonly DEFAULT_MAX_MEMORY_CACHE_SIZE = '1gb'

  constructor(@inject(TYPES.FileCacheInvalidator) private cacheInvalidator: CacheInvalidators.FileChangedInvalidator) {
    this.cache = new LRU({
      max: asBytes(process.env.BP_MAX_MEMORY_CACHE_SIZE || MemoryObjectCache.DEFAULT_MAX_MEMORY_CACHE_SIZE),
      length: sizeof
    })

    this.cacheInvalidator.install(this)
  }

  get<T>(key: string): T {
    return <T>this.cache.get(key)
  }

  set<T>(key: string, obj: T): void {
    const keyAlreadyExist = this.has(key)
    const keyUpdated = this.cache.set(key, obj)

    if (keyAlreadyExist && keyUpdated) {
      this.events.emit(EVENTS.invalidation, key)
    }
  }

  has(key: string): boolean {
    return this.cache.has(key)
  }

  async invalidate(key: string): Promise<void> {
    if (this.has(key)) {
      this.cache.del(key)

      this.events.emit(EVENTS.invalidation, key)
    }
  }

  async invalidateStartingWith(prefix: string): Promise<void> {
    const keys = this.cache.keys().filter(x => {
      // TODO: Move buffer::, string:: and object:: into a constant/utils file
      return x.startsWith('buffer::' + prefix) || x.startsWith('string::' + prefix) || x.startsWith('object::' + prefix)
    })

    keys.forEach(x => this.invalidate(x))
  }

  async sync(message: string): Promise<void> {
    this.events.emit(EVENTS.syncDbFilesToDisk, message)
  }
}

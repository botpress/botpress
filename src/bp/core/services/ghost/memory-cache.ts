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

  constructor(@inject(TYPES.FileCacheInvalidator) private cacheInvalidator: CacheInvalidators.FileChangedInvalidator) {
    this.cache = new LRU({
      max: asBytes(process.core_env.BP_MAX_MEMORY_CACHE_SIZE || '1gb'),
      length: sizeof
    })

    this.cacheInvalidator.install(this)
  }

  async get<T>(key: string): Promise<T> {
    return <T>this.cache.get(key)
  }

  async set<T>(key: string, obj: T): Promise<void> {
    const keyAlreadyExist = await this.has(key)

    const keyUpdated = this.cache.set(key, obj)

    if (keyAlreadyExist && keyUpdated) {
      this.events.emit(EVENTS.invalidation, key)
    }
  }

  async has(key: string): Promise<boolean> {
    return this.cache.has(key)
  }

  async invalidate(key: string): Promise<void> {
    if (await this.has(key)) {
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

import { ObjectCache } from 'common/object-cache'
import { asBytes } from 'core/misc/utils'
import { EventEmitter } from 'events'
import { inject, injectable } from 'inversify'
import LRU from 'lru-cache'

import { TYPES } from '../../types'

import { CacheInvalidators } from './cache-invalidators'

@injectable()
export default class MemoryObjectCache implements ObjectCache {
  cache: LRU.Cache<string, any>
  public readonly events: EventEmitter = new EventEmitter()

  constructor(@inject(TYPES.FileCacheInvalidator) private cacheInvalidator: CacheInvalidators.FileChangedInvalidator) {
    this.cache = LRU({
      max: asBytes(process.core_env.BP_MAX_MEMORY_CACHE_SIZE || '1gb'),
      length: (n, key) => {
        if (key.startsWith('buffer::')) {
          return n.length
        } else if (key.startsWith('string::')) {
          return n.length * 2 // each char is 2 bytes in ECMAScript
        }

        return 500 // Assuming 500 bytes per objects, this is kind of random
      }
    })

    this.cacheInvalidator.install(this)
  }

  async get<T>(key: string): Promise<T> {
    return <T>this.cache.get(key)
  }

  async set<T>(key: string, obj: T): Promise<void> {
    this.cache.set(key, obj)
    this.events.emit('invalidation', key)
  }

  async has(key: string): Promise<boolean> {
    return this.cache.has(key)
  }

  async invalidate(key: string): Promise<void> {
    this.cache.del(key)
    this.events.emit('invalidation', key)
  }

  async invalidateStartingWith(prefix: string): Promise<void> {
    const keys = this.cache.keys().filter(x => {
      return x.startsWith('buffer::' + prefix) || x.startsWith('string::' + prefix) || x.startsWith('object::' + prefix)
    })

    keys.forEach(x => this.cache.del(x))
    this.events.emit('invalidation', prefix)
  }
}

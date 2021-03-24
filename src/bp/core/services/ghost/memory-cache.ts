import { ObjectCache } from 'common/object-cache'
import { TYPES } from 'core/app/types'
import { asBytes } from 'core/misc/utils'
import { EventEmitter } from 'events'
import { inject, injectable } from 'inversify'
import LRU from 'lru-cache'

import { CacheInvalidators } from './cache-invalidators'

@injectable()
export class MemoryObjectCache implements ObjectCache {
  private cache: LRU<string, any>

  public readonly events: EventEmitter = new EventEmitter()

  constructor(@inject(TYPES.FileCacheInvalidator) private cacheInvalidator: CacheInvalidators.FileChangedInvalidator) {
    this.cache = new LRU({
      max: asBytes(process.core_env.BP_MAX_MEMORY_CACHE_SIZE || '1gb'),
      length: obj => {
        if (Buffer.isBuffer(obj)) {
          return obj.length
        } else if (typeof obj === 'string') {
          return obj.length * 2 // chars are 2 bytes in ECMAScript
        }

        return 1024 // Assuming 1kb per object, this is kind of random
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

  async sync(message: string): Promise<void> {
    this.events.emit('syncDbFilesToDisk', message)
  }
}

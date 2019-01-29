import { ObjectCache } from 'common/object-cache'
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
      // For now we cache up to 5000 elements, whatever the size
      // We will probably want to assign different length to various element types in the future
      max: 5000
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

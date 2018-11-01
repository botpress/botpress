import { inject, injectable } from 'inversify'
import LRU from 'lru-cache'

import { TYPES } from '../../types'

import { ObjectCache } from '.'
import { CacheInvalidators } from './cache-invalidators'

@injectable()
export default class MemoryObjectCache implements ObjectCache {
  cache: LRU.Cache<string, any>

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
  }

  async has(key: string): Promise<boolean> {
    return this.cache.has(key)
  }

  async invalidate(key: string): Promise<void> {
    this.cache.del(key)
  }

  async invalidateStartingWith(prefix: string): Promise<void> {
    const keys = this.cache.keys().filter(x => {
      return x.startsWith('buffer::' + prefix) || x.startsWith('string::' + prefix)
    })

    keys.forEach(x => this.cache.del(x))
  }
}

import { injectable } from 'inversify'
import LRU from 'lru-cache'

import { ObjectCache } from '.'

@injectable()
export default class MemoryObjectCache implements ObjectCache {
  cache: LRU.Cache<string, any>

  constructor() {
    this.cache = LRU({
      // For now we cache up to 5000 elements, whatever the size
      // We will probably want to assign different length to various element types in the future
      max: 5000,
      length: () => 1 // So we only count the number of objects
    })
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
}

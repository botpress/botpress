import LRUCache from 'lru-cache'
import { ColdListEntityModel, EntityCache, EntityCacheDump, EntityExtractionResult } from 'nlu-core/typings'

interface CacheByName {
  [name: string]: EntityCacheDump
}

export function warmEntityCache(coldCache: EntityCacheDump): EntityCache {
  const warmedCache = new LRUCache<string, EntityExtractionResult[]>(1000)
  warmedCache.load(coldCache)
  return warmedCache
}

export class EntityCacheManager {
  private cache: CacheByName = {}

  getCache(listEntity: string): EntityCacheDump {
    if (!this.cache[listEntity]) {
      this.cache[listEntity] = []
    }
    return this.cache[listEntity]
  }

  loadFromData(listEntities: ColdListEntityModel[]) {
    for (const e of listEntities) {
      this.setCache(e.entityName, e.cache)
    }
  }

  private setCache(listEntity: string, cache: EntityCacheDump) {
    this.cache[listEntity] = cache
  }
}

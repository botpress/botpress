import { ColdListEntityModel, EntityCacheDump } from 'nlu-core/typings'

type CacheByName = {
  [name: string]: EntityCacheDump
}

export class EntityCacheManager {
  private cache: CacheByName = {}

  getCache(listEntity: string): EntityCacheDump {
    if (!this.cache[listEntity]) {
      this.cache[listEntity] = []
    }
    return this.cache[listEntity]
  }

  setCacheByBatch(listEntities: ColdListEntityModel[]) {
    for (const e of listEntities) {
      this.setCache(e.entityName, e.cache)
    }
  }

  setCache(listEntity: string, cache: EntityCacheDump) {
    this.cache[listEntity] = cache
  }
}

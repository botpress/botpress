import _ from 'lodash'
import LRUCache from 'lru-cache'

type TypedCache<T> = LRUCache<string, T>

const cacheMap: _.Dictionary<TypedCache<any>> = {}

function getCacheId(name: string, prefix: string = ''): string {
  return `${prefix}.${name}`
}

export function getOrCreateCache<T>(name: string, botId?: string, options?: { maxElements?: number }): TypedCache<T> {
  const cacheId = getCacheId(name, botId)
  if (!cacheMap[cacheId]) {
    const max = options?.maxElements ?? 1000
    cacheMap[cacheId] = new LRUCache(max)
  }
  return cacheMap[cacheId]
}

export function deleteCache(name: string, botId?: string) {
  const cacheId = getCacheId(name, botId)
  cacheMap.cacheId.reset()
  delete cacheMap[cacheId]
}

export function copyCache(currentName: string, targetName: string, botId?: string) {
  const currentCacheId = getCacheId(currentName, botId)
  const targetCacheId = getCacheId(targetName, botId)
  cacheMap[targetCacheId] = _.clone(cacheMap[currentCacheId])
}

// TODO: load cache from path
// TODO: load cache from data

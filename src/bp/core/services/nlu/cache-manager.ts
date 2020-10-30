import _ from 'lodash'
import LRUCache from 'lru-cache'

const cacheMap: _.Dictionary<LRUCache<string, any>> = {}

function getCacheId(name: string, prefix: string = ''): string {
  return `${prefix}.${name}`
}

export function getOrCreateCache<T>(
  name: string,
  botId?: string,
  options?: LRUCache.Options<string, T>
): LRUCache<string, T> {
  const cacheId = getCacheId(name, botId)
  if (!cacheMap[cacheId]) {
    // @ts-ignore
    cacheMap[cacheId] = new LRUCache(options || 1000)
  }
  return cacheMap[cacheId]
}

export function deleteCache(name: string, botId?: string) {
  const cacheId = getCacheId(name, botId)
  cacheMap[cacheId]?.reset()
  delete cacheMap[cacheId]
}

export function copyCache(currentName: string, newName: string, botId?: string) {
  const currentCacheId = getCacheId(currentName, botId)
  const targetCacheId = getCacheId(newName, botId)
  cacheMap[targetCacheId] = _.clone(cacheMap[currentCacheId])
}

export function loadCacheFromData<T>(
  data: LRUCache.Entry<string, T>[],
  name: string,
  botId?: string
): LRUCache<string, T> {
  const cache = getOrCreateCache<T>(name, botId)
  if (cache.length === 0) {
    cache.load(data)
  }
  return cache
}

// if necessary implement loadCacheFromPath

export function isCacheDump(data: any): boolean {
  return !(typeof data?.has === 'function')
}

import LRUCache from 'lru-cache'
import path from 'path'

import _ from 'lodash'

const CACHE_PATH = path.join(process.APP_DATA_PATH || '', 'cache', 'custom-entities.json')

// Maybe reset this as classes ...

// botId : entityId : utterance : extracted[]
// const _cacheMap: _.Dictionary<_.Dictionary<EntityCache>> = {}

// function _createCache(): EntityCache {
//   // TODO add options properly here
//   return new LRUCache()
// }

// export function addBot(botId: string) {
//   _cacheMap[botId] = {}
// }

// export function removeBot(botId: string) {
//   delete _cacheMap[botId]
// }

// export function invalidateEntityCache(botId: string, entityName: string) {
//   _cacheMap[botId][entityName]?.reset()
// }

// export function getEntityCache(botId: string, entityName: string): EntityCache {
//   if (!_cacheMap[botId][entityName]) {
//     _cacheMap[botId][entityName] = _createCache()
//   }
//   return _cacheMap[botId][entityName]
// }

// export function copyEntityCache(botId: string, previousName: string, nextName: string) {
//   _cacheMap[botId][nextName] = _cacheMap[botId][previousName]
//   deleteEntityCache(botId, previousName)
// }

// export function deleteEntityCache(botId: string, entityName: string) {
//   delete _cacheMap[botId][entityName]
// }

type TypedCache<T> = LRUCache<string, T>

// We might want to make this more generic BotCache
export interface BotCacheManager {
  getOrCreateCache<T>(botId: string, name: string, size?: number): TypedCache<T>
  deleteCache(botId: string, name: string): void
  copyCache: (botId: string, name: string, targetName: string) => void
}

/////

const cacheMap: _.Dictionary<TypedCache<any>> = {}

function getCacheId(name: string, prefix: string = ''): string {
  return `${prefix}.${name}`
}

export function getOrCreateCache<T>(name: string, botId?: string, options?: { maxElements?: number }): TypedCache<T> {
  const cacheId = getCacheId(name, botId)
  if (!cacheMap[cacheId]) {
    cacheMap[cacheId] = new LRUCache(options.maxElements || 1000)
  }
  return cacheMap[cacheId]
}

export function deleteCache(name: string, prefix?: string) {
  const cacheId = getCacheId(name, prefix)
  cacheMap.cacheId.reset()
  delete cacheMap[cacheId]
}

export function copyCache(name: string, targetName: string, prefix?: string) {
  const currentCacheId = getCacheId(name, prefix)
  const targetCacheId = getCacheId(targetName, prefix)
  cacheMap[targetCacheId] = _.clone(cacheMap[currentCacheId])
}

// export class CacheManager implements BotCacheManager {
//   private static _cacheMap: _.Dictionary<TypedCache<any>> = {}

//   private static cache

//   static getOrCreateCache<T>(botId: string, name: string, size?: number): TypedCache<T> {
//     if(!this._cacheMap[])
//     throw new Error('Method not implemented.')
//   }
//   static deleteCache(botId: string, name: string): void {
//     throw new Error('Method not implemented.')
//   }
//   static copyCache: (botId: string, name: string, targetName: string) => void
// }

// export default class BotCacheProvider {
//   private static _botCacheMap: _.Dictionary<BotCacheManager>

//   public static getBotCache(botId: string): BotCacheManager {
//     return BotCacheProvider._botCacheMap[botId]
//   }

//   public static async loadBotCaches(botId: string) {
//     // check on fs
//     // if there is a cache dump,
//   }

//   public static deleteBotCache(botId: string) {}
// }

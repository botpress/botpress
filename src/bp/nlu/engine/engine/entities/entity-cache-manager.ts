import { ensureFile, pathExists, readJSON, writeJson } from 'fs-extra'
import _ from 'lodash'
import LRUCache from 'lru-cache'
import ms from 'ms'
import sizeof from 'object-sizeof'
import { Logger } from '../../typings'
import { ColdListEntityModel, EntityCache, EntityCacheDump, EntityExtractionResult, KeyedItem } from '../typings'

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

export class SystemEntityCacheManager {
  private _path: string
  private _cache: LRUCache<string, EntityExtractionResult[]>
  private _dumpEnabled: boolean
  private readonly _logger: Logger | undefined

  constructor(path: string, dumpEnabled: boolean, logger?: Logger) {
    this._logger = logger
    this._path = path
    this._dumpEnabled = dumpEnabled
    this._cache = new LRUCache<string, EntityExtractionResult[]>({
      length: (val: any, key: string) => sizeof(val) + sizeof(key),
      max:
        1000 * // n bytes per entity
        2 * // entities per utterance
        10 * // n utterances per intent
        100 * // n intents per bot
        50 // n bots
      // ~ 100 mb
    })
  }

  public reset() {
    this._cache.reset()
  }

  public splitCacheHitFromCacheMiss(inputs: string[], useCache: boolean): KeyedItem[][] {
    const [cachedItems, toFetchItems] = inputs.reduce(
      ([cached, toFetch], input, idx) => {
        if (useCache && this._cache.has(input)) {
          const entities = this._cache.get(input)
          return [[...cached, { input, idx, entities }], toFetch]
        } else {
          return [cached, [...toFetch, { input, idx }]]
        }
      },
      [[], []] as [KeyedItem[], KeyedItem[]]
    )
    return [cachedItems, toFetchItems]
  }

  public async restoreCache() {
    try {
      if (await pathExists(this._path)) {
        const dump = await readJSON(this._path)
        if (dump) {
          this._cache.load(dump)
        }
      }
    } catch (err) {
      this._logger?.error(`Could not load cache from ${this._path}`)
    }
  }

  private async _dumpCache() {
    await ensureFile(this._path)
    await writeJson(this._path, this._cache.dump())
  }

  private _onCacheChanged = _.debounce(async () => {
    if (this._dumpEnabled) {
      try {
        await this._dumpCache()
      } catch (err) {
        this._logger?.error(`Could not persist system entities cache, error ${err.message}`, err)
        this._dumpEnabled = false
      }
    }
  }, ms('10s'))

  public async cacheBatchResults(inputs: string[], results: EntityExtractionResult[][]) {
    _.zipWith(inputs, results, (input, entities) => ({ input, entities })).forEach(({ input, entities }) => {
      this._cache.set(input, entities)
    })

    await this._onCacheChanged()
  }
}

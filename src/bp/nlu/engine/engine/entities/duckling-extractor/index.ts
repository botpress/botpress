import _ from 'lodash'
import { Logger } from '../../../typings'
import { extractPattern } from '../../tools/patterns-utils'
import { JOIN_CHAR } from '../../tools/token-utils'
import { EntityExtractionResult, KeyedItem, SystemEntityExtractor } from '../../typings'
import { SystemEntityCacheManager } from '../entity-cache-manager'
import { DucklingClient, DucklingParams } from './duckling-client'
import { DUCKLING_ENTITIES } from './enums'
import { mapDucklingToEntity } from './map-duckling'

const BATCH_SIZE = 10

// Further improvements:
// 1- in _extractBatch, shift results ==> don't walk whole array n times (nlog(n) vs n2)

export class DucklingEntityExtractor implements SystemEntityExtractor {
  private _enabled: boolean
  private _provider: DucklingClient

  public enable() {
    this._enabled = true
  }
  public disable() {
    this._enabled = false
  }

  constructor(private _cache: SystemEntityCacheManager, private readonly logger?: Logger) {
    this._enabled = false
    this.logger = logger
    this._provider = new DucklingClient(logger)
  }

  public resetCache() {
    this._cache.reset()
  }

  public get entityTypes(): string[] {
    return this._enabled ? DUCKLING_ENTITIES : []
  }

  public async configure(enabled: boolean, url: string) {
    if (enabled) {
      this._enabled = await DucklingClient.init(url, this.logger)
      await this._cache.restoreCache()
    }
  }

  public async extractMultiple(
    inputs: string[],
    lang: string,
    useCache?: boolean
  ): Promise<EntityExtractionResult[][]> {
    if (!this._enabled) {
      return Array(inputs.length).fill([])
    }

    const options = {
      lang,
      tz: this._getTz(),
      refTime: Date.now()
    }

    const [cached, toFetch] = this._cache.splitCacheHitFromCacheMiss(inputs, !!useCache)

    const chunks = _.chunk(toFetch, BATCH_SIZE)
    const batchedRes = await Promise.mapSeries(chunks, c => this._extractBatch(c, options))

    return _.chain(batchedRes)
      .flatten()
      .concat(cached)
      .orderBy('idx')
      .map(x => x.entities!)
      .value()
  }

  public async extract(input: string, lang: string, useCache?: boolean): Promise<EntityExtractionResult[]> {
    return (await this.extractMultiple([input], lang, useCache))[0]
  }

  private async _extractBatch(batch: KeyedItem[], params: DucklingParams): Promise<KeyedItem[]> {
    if (_.isEmpty(batch)) {
      return []
    }
    // trailing JOIN_CHAR so we have n joints and n examples
    const strBatch = batch.map(x => x.input)
    const concatBatch = strBatch.join(JOIN_CHAR) + JOIN_CHAR
    const batchEntities = await this._fetchDuckling(concatBatch, params)
    const splitLocations = extractPattern(concatBatch, new RegExp(JOIN_CHAR)).map(v => v.sourceIndex)
    const entities = splitLocations.map((to, idx, locs) => {
      const from = idx === 0 ? 0 : locs[idx - 1] + JOIN_CHAR.length
      return batchEntities
        .filter(e => e.start >= from && e.end <= to)
        .map(e => ({
          ...e,
          start: e.start - from,
          end: e.end - from
        }))
    })

    await this._cache.cacheBatchResults(strBatch, entities)

    return batch.map((batchItm, i) => ({ ...batchItm, entities: entities[i] }))
  }

  private async _fetchDuckling(text: string, params: DucklingParams): Promise<EntityExtractionResult[]> {
    const duckReturn = await this._provider.fetchDuckling(text, params)
    return duckReturn.map(mapDucklingToEntity)
  }

  private _getTz(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  }
}

import { NLU } from 'botpress/sdk'
import _ from 'lodash'

import path from 'path'
import { extractPattern } from '../../tools/patterns-utils'
import { JOIN_CHAR } from '../../tools/token-utils'
import { EntityExtractionResult, KeyedItem, SystemEntityExtractor } from '../../typings'
import { SystemEntityCacheManager } from '../entity-cache-manager'
import { DucklingClient, DucklingParams } from './duckling-client'
import { mapDucklingToEntity } from './map-duckling'
import { DucklingDimension } from './typings'

const BATCH_SIZE = 10

export const DUCKLING_ENTITIES: DucklingDimension[] = [
  'amountOfMoney',
  'distance',
  'duration',
  'email',
  'number',
  'ordinal',
  'phoneNumber',
  'quantity',
  'temperature',
  'time',
  'url',
  'volume'
]

// Further improvements:
// 1- in _extractBatch, shift results ==> don't walk whole array n times (nlog(n) vs n2)

export class DucklingEntityExtractor implements SystemEntityExtractor {
  public enabled: boolean
  private _provider: DucklingClient
  private _cache: SystemEntityCacheManager

  constructor(private readonly logger?: NLU.Logger) {
    this.enabled = false
    this.logger = logger
    this._provider = new DucklingClient(logger)
    this._cache = new SystemEntityCacheManager(
      path.join(process.APP_DATA_PATH || '', 'cache', 'duckling_sys_entities.json'),
      true,
      logger
    )
  }

  public get entityTypes(): string[] {
    return this.enabled ? DUCKLING_ENTITIES : []
  }

  public async configure(enabled: boolean, url: string) {
    if (enabled) {
      this.enabled = await DucklingClient.init(url, this.logger)
      await this._cache.restoreCache()
    }
  }

  public async extractMultiple(
    inputs: string[],
    lang: string,
    useCache?: boolean
  ): Promise<EntityExtractionResult[][]> {
    if (!this.enabled) {
      return Array(inputs.length).fill([])
    }

    const options = {
      lang,
      tz: this._getTz(),
      refTime: Date.now()
    }

    const [cached, toFetch] = this._cache.getCachedAndToFetch(inputs)

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

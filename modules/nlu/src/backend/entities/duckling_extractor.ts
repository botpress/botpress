import Axios, { AxiosInstance } from 'axios'
import retry from 'bluebird-retry'
import * as sdk from 'botpress/sdk'
import { ensureFile, pathExists, readJSON, writeJson } from 'fs-extra'
import httpsProxyAgent from 'https-proxy-agent'
import _ from 'lodash'
import lru from 'lru-cache'
import ms from 'ms'
import sizeof from 'object-sizeof'
import path from 'path'

import { extractPattern } from '../tools/patterns-utils'
import { SPACE } from '../tools/token-utils'
import { EntityExtractionResult, SystemEntityExtractor } from '../typings'

interface DucklingParams {
  tz: string
  refTime: number
  lang: string
}

interface KeyedItem {
  input: string
  idx: number
  entities?: EntityExtractionResult[]
}

export const JOIN_CHAR = `::${SPACE}::`
const BATCH_SIZE = 10
const DISABLED_MSG = `, so it will be disabled.
For more information (or if you want to self-host it), please check the docs at
https://botpress.com/docs/build/nlu/#system-entities
`
const DUCKLING_ENTITIES = [
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

const RETRY_POLICY = { backoff: 2, max_tries: 3, timeout: 500 }
const CACHE_PATH = path.join(process.APP_DATA_PATH || '', 'cache', 'sys_entities.json')

// Further improvements:
// 1 - Duckling entity interface
// 3- in _extractBatch, shift results ==> don't walk whole array n times (nlog(n) vs n2)

export class DucklingEntityExtractor implements SystemEntityExtractor {
  public static enabled: boolean
  public static client: AxiosInstance

  private static _cache: lru<string, EntityExtractionResult[]>
  private _cacheDumpEnabled = true

  constructor(private readonly logger?: sdk.Logger) {}

  public static get entityTypes(): string[] {
    return DucklingEntityExtractor.enabled ? DUCKLING_ENTITIES : []
  }

  public static async configure(enabled: boolean, url: string, logger?: sdk.Logger) {
    if (enabled) {
      const proxyConfig = process.PROXY ? { httpsAgent: new httpsProxyAgent(process.PROXY) } : {}
      this.client = Axios.create({
        baseURL: url,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        ...proxyConfig
      })

      try {
        await retry(async () => {
          const { data } = await this.client.get('/')
          if (data !== 'quack!') {
            return logger && logger.warn(`Bad response from Duckling server ${DISABLED_MSG}`)
          }
          this.enabled = true
        }, RETRY_POLICY)
      } catch (err) {
        logger && logger.attachError(err).warn(`Couldn't reach the Duckling server ${DISABLED_MSG}`)
      }

      this._cache = new lru<string, EntityExtractionResult[]>({
        length: (val: any, key: string) => sizeof(val) + sizeof(key),
        max:
          1000 * // n bytes per entity
          2 * // entities per utterance
          10 * // n utterances per intent
          100 * // n intents per bot
          50 // n bots
        // ~ 100 mb
      })

      await this._restoreCache()
    }
  }

  private static async _restoreCache() {
    try {
      if (await pathExists(CACHE_PATH)) {
        const dump = await readJSON(CACHE_PATH)
        if (dump) {
          this._cache.load(dump)
        }
      }
    } catch (err) {
      console.log('could not load duckling cache')
    }
  }

  public async extractMultiple(
    inputs: string[],
    lang: string,
    useCache?: boolean
  ): Promise<EntityExtractionResult[][]> {
    if (!DucklingEntityExtractor.enabled) return Array(inputs.length).fill([])
    const options = {
      lang,
      tz: this._getTz(),
      refTime: Date.now()
    }

    const [cached, toFetch] = inputs.reduce(
      ([cached, toFetch], input, idx) => {
        if (useCache && DucklingEntityExtractor._cache.has(input)) {
          const entities = DucklingEntityExtractor._cache.get(input)
          return [[...cached, { input, idx, entities }], toFetch]
        } else {
          return [cached, [...toFetch, { input, idx }]]
        }
      },
      [[], []]
    ) as [KeyedItem[], KeyedItem[]]

    const chunks = _.chunk(toFetch, BATCH_SIZE)
    const batchedRes = await Promise.mapSeries(chunks, c => this._extractBatch(c, options))

    return _.chain(batchedRes)
      .flatten()
      .concat(cached)
      .orderBy('idx')
      .map('entities')
      .value()
  }

  public async extract(input: string, lang: string, useCache?: boolean): Promise<EntityExtractionResult[]> {
    return (await this.extractMultiple([input], lang, useCache))[0]
  }

  private async _dumpCache() {
    try {
      await ensureFile(CACHE_PATH)
      await writeJson(CACHE_PATH, DucklingEntityExtractor._cache.dump())
    } catch (err) {
      this.logger.error('could not persist system entities cache, error' + err.message)
      this._cacheDumpEnabled = false
    }
  }

  private _onCacheChanged = _.debounce(async () => {
    if (this._cacheDumpEnabled) {
      await this._dumpCache()
    }
  }, ms('10s'))

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
    await this._cacheBatchResults(strBatch, entities)

    return batch.map((batchItm, i) => ({ ...batchItm, entities: entities[i] }))
  }

  private async _fetchDuckling(text: string, { lang, tz, refTime }: DucklingParams): Promise<EntityExtractionResult[]> {
    try {
      return await retry(async () => {
        const { data } = await DucklingEntityExtractor.client.post(
          '/parse',
          `lang=${lang}&text=${text}&reftime=${refTime}&tz=${tz}`
        )

        if (!_.isArray(data)) {
          throw new Error('Unexpected response from Duckling. Expected an array.')
        }

        return data.map(this._mapDuckToEntity.bind(this))
      }, RETRY_POLICY)
    } catch (err) {
      const error = err.response ? err.response.data : err
      this.logger && this.logger.attachError(error).warn('Error extracting duckling entities')
      return []
    }
  }

  private async _cacheBatchResults(inputs: string[], results: EntityExtractionResult[][]) {
    _.zip(inputs, results).forEach(([input, entities]) => {
      DucklingEntityExtractor._cache.set(input, entities)
    })

    await this._onCacheChanged()
  }

  private _getTz(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  }

  private _mapDuckToEntity(duckEnt): EntityExtractionResult {
    const dimensionData = this._getUnitAndValue(duckEnt.dim, duckEnt.value)
    return {
      confidence: 1,
      start: duckEnt.start,
      end: duckEnt.end,
      type: duckEnt.dim,
      value: dimensionData.value,
      metadata: {
        extractor: 'system',
        source: duckEnt.body,
        entityId: `system.${duckEnt.dim}`,
        unit: dimensionData.unit
      }
    } as EntityExtractionResult
  }

  private _getUnitAndValue(dimension, rawVal) {
    switch (dimension) {
      case 'duration':
        return rawVal.normalized
      case 'time':
        return {
          value: rawVal.value,
          unit: rawVal.grain
        }
      default:
        return {
          value: rawVal.value,
          unit: rawVal.unit
        }
    }
  }
}

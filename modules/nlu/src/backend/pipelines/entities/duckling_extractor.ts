import Axios, { AxiosInstance } from 'axios'
import * as sdk from 'botpress/sdk'
import httpsProxyAgent from 'https-proxy-agent'
import _ from 'lodash'

import { extractPattern } from '../../tools/patterns-utils'
import { SPACE } from '../../tools/token-utils'

interface DucklingParams {
  tz: string
  refTime: number
  lang: string
}

export const JOIN_CHAR = `::${SPACE}::`
const BATCH_SIZE = 10
const DISABLED_MSG = `, so it will be disabled.
For more informations (or if you want to self-host it), please check the docs at
https://botpress.io/docs/build/nlu/#system-entities
`

// TODO duckling entity interface ?
// TODO duckling entity results mapper ?
export class DucklingEntityExtractor {
  public static enabled: boolean
  public static client: AxiosInstance

  constructor(private readonly logger?: sdk.Logger) {}

  public static get entityTypes(): string[] {
    return DucklingEntityExtractor.enabled
      ? [
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
      : []
  }

  public static async configure(enabled: boolean, url: string, logger: sdk.Logger) {
    if (enabled) {
      const proxyConfig = process.PROXY ? { httpsAgent: new httpsProxyAgent(process.PROXY) } : {}

      this.client = Axios.create({
        baseURL: url,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        ...proxyConfig
      })

      try {
        const { data } = await this.client.get('/')
        if (data !== 'quack!') {
          return logger.warn(`Bad response from Duckling server ${DISABLED_MSG}`)
        }
        this.enabled = true
      } catch (err) {
        logger.attachError(err).warn(`Couldn't reach the Duckling server ${DISABLED_MSG}`)
      }
    }
  }

  public async extractMultiple(inputs: string[], lang: string, useCache?: boolean): Promise<sdk.NLU.Entity[][]> {
    if (!DucklingEntityExtractor.enabled) return Array(inputs.length).fill([])
    const options = {
      lang,
      tz: this._getTz(),
      refTime: Date.now()
    }

    // TODO (if useCache) pop cached results before chunking
    const batchedTexts = _.chunk(inputs, BATCH_SIZE)
    const batches = await Promise.mapSeries(batchedTexts, batch => this._extractBatch(batch, options))
    return _.flatten(batches)
    // TODO cache individual results if useCache
    // TODO merge with cached results, make sure to keep the order (just like language provider)
  }

  public async extract(input: string, lang: string, useCache?: boolean): Promise<sdk.NLU.Entity[]> {
    return (await this.extractMultiple([input], lang, useCache))[0]
  }

  private async _extractBatch(batch: string[], params: DucklingParams) {
    // trailing JOIN_CHAR so we have n joints and n examples
    const concatBatch = batch.join(JOIN_CHAR) + JOIN_CHAR
    const batchRes = await this.fetchDuckling(concatBatch, params)
    const splitLocations = extractPattern(concatBatch, new RegExp(JOIN_CHAR)).map(v => v.sourceIndex)
    return splitLocations.map((to, idx, locs) => {
      const from = idx === 0 ? 0 : locs[idx - 1] + JOIN_CHAR.length
      // shift the results to make sure we dont go through the whole array n times
      return batchRes
        .filter(e => e.meta.start >= from && e.meta.end <= to)
        .map(e => ({
          ...e,
          meta: {
            ...e.meta,
            start: e.meta.start - from,
            end: e.meta.end - from
          }
        }))
    })
  }

  // TODO add proper retry policy here
  private async fetchDuckling(text: string, { lang, tz, refTime }: DucklingParams): Promise<sdk.NLU.Entity[]> {
    try {
      const { data } = await DucklingEntityExtractor.client.post(
        '/parse',
        `lang=${lang}&text=${text}&reftime=${refTime}&tz=${tz}`
      )

      if (!_.isArray(data)) {
        throw new Error('Unexpected response from Duckling. Expected an array.')
      }

      return data.map(ent => ({
        name: ent.dim,
        type: 'system',
        meta: this._mapMeta(ent),
        data: this._mapBody(ent.dim, ent.value)
      }))
    } catch (err) {
      const error = err.response ? err.response.data : err
      this.logger && this.logger.attachError(error).warn('[Native] error extracting duckling entities')
      return []
    }
  }

  private _getTz(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  }

  private _mapMeta(DEntity): sdk.NLU.EntityMeta {
    return {
      confidence: 1, // rule based extraction
      provider: 'native',
      source: DEntity.body,
      start: DEntity.start,
      end: DEntity.end,
      raw: DEntity
    }
  }

  private _mapBody(dimension, rawVal): sdk.NLU.EntityBody {
    switch (dimension) {
      case 'duration':
        const normalized = rawVal.normalized
        delete rawVal['normalized']
        return {
          ...normalized,
          extras: rawVal
        }
      case 'quantity':
        return {
          value: rawVal.value,
          unit: rawVal.unit,
          extras: { product: rawVal.product }
        }
      case 'time':
        return {
          value: rawVal.value,
          unit: rawVal.grain,
          extras: rawVal.values.length ? rawVal.values : {}
        }
      default:
        return {
          extras: {},
          value: rawVal.value,
          unit: rawVal.unit
        }
    }
  }
}

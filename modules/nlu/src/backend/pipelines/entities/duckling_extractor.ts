import Axios, { AxiosInstance } from 'axios'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { EntityExtractor } from '../../typings'

export class DucklingEntityExtractor implements EntityExtractor {
  public static enabled: boolean
  public static client: AxiosInstance

  constructor(private readonly logger: sdk.Logger) {}

  static configure(enabled: boolean, url: string) {
    this.enabled = enabled
    if (enabled) {
      this.client = Axios.create({
        baseURL: url,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
    }
  }

  public async extract(text: string, lang: string): Promise<sdk.NLU.Entity[]> {
    if (!DucklingEntityExtractor.enabled) return []

    try {
      const tz = this._getTz()
      const { data } = await DucklingEntityExtractor.client.post(
        '/parse',
        `lang=${lang}&text=${text}&reftime=${Date.now()}&tz=${tz}`
      )

      if (!_.isArray(data)) {
        throw new Error('Unexpected response from Duckling. Expected an array.')
      }

      return data.map(ent => ({
        type: ent.dim,
        meta: this._mapMeta(ent),
        data: this._mapBody(ent.dim, ent.value)
      }))
    } catch (err) {
      const error = err.response ? err.response.data : err
      this.logger.attachError(error).warn('[Native] error extracting duckling entities')
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

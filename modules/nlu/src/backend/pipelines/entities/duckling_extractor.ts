import Axios, { AxiosInstance } from 'axios'
import * as sdk from 'botpress/sdk'
import httpsProxyAgent from 'https-proxy-agent'
import _ from 'lodash'

import { EntityExtractor } from '../../typings'

export class DucklingEntityExtractor implements EntityExtractor {
  public static enabled: boolean
  public static client: AxiosInstance

  constructor(private readonly logger?: sdk.Logger) {}

  static async configure(enabled: boolean, url: string, logger: sdk.Logger) {
    if (enabled) {
      const proxyConfig = process['PROXY'] ? { httpsAgent: new httpsProxyAgent(process['PROXY']) } : {}

      this.client = Axios.create({
        baseURL: url,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        ...proxyConfig
      })

      const ducklingDisabledMsg = `, so it will be disabled.
For more informations (or if you want to self-host it), please check the docs at
https://botpress.io/docs/build/nlu/#system-entities
`

      try {
        const { data } = await this.client.get('/')
        if (data !== 'quack!') {
          return logger.warn(`Bad response from Duckling server ${ducklingDisabledMsg}`)
        }
        this.enabled = true
      } catch (err) {
        logger.attachError(err).warn(`Couldn't reach the Duckling server ${ducklingDisabledMsg}`)
      }
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

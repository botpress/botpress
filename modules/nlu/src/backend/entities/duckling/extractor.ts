import Axios, { AxiosInstance } from 'axios'

import { Entity, EntityBody, EntityMeta } from '../entities'

export class DucklingEntityExtractor {
  enabled: boolean
  client: AxiosInstance
  logger: any

  constructor(enabled: boolean, ducklingURL: string = '', logger) {
    this.enabled = enabled
    this.logger = logger
    this.client = Axios.create({
      baseURL: ducklingURL,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
  }

  private mapMeta(DEntity): EntityMeta {
    return {
      confidence: 1, // rule based extraction
      provider: 'native',
      source: DEntity.body,
      start: DEntity.start,
      end: DEntity.end,
      raw: DEntity
    }
  }

  private mapBody(dimension, rawVal): EntityBody {
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

  async extract(text, lang): Promise<Entity[]> {
    if (!this.enabled) return []

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

    try {
      const res = await this.client.post('/parse', `lang=${lang}&text=${text}&reftime=${Date.now()}&tz=${tz}`)

      return res.data.map(ent => ({
        type: ent.dim,
        meta: this.mapMeta(ent),
        data: this.mapBody(ent.dim, ent.value)
      }))
    } catch (err) {
      this.logger.debug('[Native] error extracting duckling entities')
      return []
    }
  }
}

import Axios, { AxiosInstance } from 'axios'

import Entity, { EntityBody, EntityMeta } from '../typings'

const mapMeta = (DEntity): EntityMeta => {
  return {
    confidence: 1, // rule based extraction
    provider: 'native',
    source: DEntity.body,
    start: DEntity.start,
    end: DEntity.end,
    raw: DEntity
  }
}

const mapBody = (dimension, rawVal): EntityBody => {
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
        extras: rawVal.values.lenght ? rawVal.values : {}
      }
    default:
      return {
        extras: {},
        value: rawVal.value,
        unit: rawVal.unit
      }
  }
}

export class DucklingEntityExtractor {
  client: AxiosInstance

  constructor(ducklingURL: string = '') {
    this.client = Axios.create({
      baseURL: ducklingURL,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
  }

  async extract(text, lang): Promise<Entity[]> {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

    try {
      const res = await this.client.post('/parse', `lang=${lang}&text=${text}&reftime=${Date.now()}&tz=${tz}`)

      return res.data.map(ent => ({
        type: ent.dim,
        meta: mapMeta(ent),
        data: mapBody(ent.dim, ent.value)
      }))
    } catch {
      console.error('error extracting duckling entities')
      return []
    }
  }
}

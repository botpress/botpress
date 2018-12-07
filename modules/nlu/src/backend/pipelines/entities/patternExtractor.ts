import * as sdk from 'botpress/sdk'
import flatmap from 'lodash/flatmap'

export interface EntityBody {
  extras: any
  value: any
  unit: string
}

export interface EntityMeta {
  confidence: number
  provider: string
  source: string
  start: number
  end: number
  raw: any
}

export const extractPatternEntities = (candidate: string, pattern: RegExp, accumulated: any[] = [], padding = 0): any[] => {
  const res = pattern.exec(candidate)
  if (res) {
    const value = res[0]

    const extracted = {
      meta: {
        confidence: 1,
        provider: 'native',
        source: value,
        start: res.index + padding,
        end: res.index + value.length - 1 + padding,
        raw: {}
      },
      data: {
        extras: {},
        value,
        unit: 'string',
      }
    }

    candidate = candidate.slice(0, res.index) + candidate.slice(res.index + value.length)
    return extractPatternEntities(candidate, pattern, [...accumulated, extracted], padding + value.length)
  } else return accumulated
}

export const extractAllPaternEntities = (input: string, entityDefs: sdk.NLU.EntityDefinition[]): sdk.NLU.Entity[] => {
  return flatmap(entityDefs, entityDef => {
    const regex = new RegExp(entityDef.pattern)
    return extractPatternEntities(input, regex).map(res => ({
      name: entityDef.name,
      type: entityDef.type,
      ...res
    }))
  })
}

import * as sdk from 'botpress/sdk'
import { flatMap } from 'lodash'

import { escapeRegex, extractPattern } from '../../tools/patterns-utils'

export const extractPatternEntities = (input: string, entityDefs: sdk.NLU.EntityDefinition[]): sdk.NLU.Entity[] => {
  return flatMap(entityDefs, entityDef => {
    try {
      const regex = new RegExp(entityDef.pattern!)
      return extractPattern(input, regex).map(res => ({
        name: entityDef.name,
        type: entityDef.type, // pattern
        sensitive: entityDef.sensitive,
        meta: {
          confidence: 1, // pattern always has 1 confidence
          provider: 'native',
          source: res.value,
          start: res.sourceIndex,
          end: res.sourceIndex + res.value.length,
          raw: {}
        },
        data: {
          extras: {},
          value: res.value,
          unit: 'string'
        }
      }))
    } catch (error) {
      throw Error(`Pattern of entity ${entityDef.name} is invalid`)
    }
  })
}

const _extractEntitiesFromOccurence = (
  input: string,
  lang: string,
  occurence: sdk.NLU.EntityDefOccurence,
  entityDef: sdk.NLU.EntityDefinition
): sdk.NLU.Entity[] => {
  const pattern = [occurence.name, ...occurence.synonyms].map(escapeRegex).join('|')

  const matches = []

  try {
    const regex = new RegExp(pattern, 'i')
    return extractPattern(input, regex).map(extracted => ({
      name: entityDef.name,
      type: 'list',
      meta: {
        confidence: 1, // extrated with synonyme as patterns
        provider: 'native',
        source: extracted.value,
        start: extracted.sourceIndex,
        end: extracted.sourceIndex + extracted.value.length,
        raw: {}
      },
      data: {
        extras: {},
        value: occurence.name, // cannonical value,
        unit: 'string'
      }
    }))
  } catch (error) {
    throw Error(`Something is wrong with one of ${entityDef.name}'s occurence`)
  }
}

export const extractListEntities = (
  input: string,
  lang: string,
  entityDefs: sdk.NLU.EntityDefinition[]
): sdk.NLU.Entity[] => {
  return flatMap(entityDefs, entityDef => {
    return flatMap(entityDef.occurences || [], occurence => {
      return _extractEntitiesFromOccurence(input, lang, occurence, entityDef)
    })
  })
}

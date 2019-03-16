import 'bluebird-global'
import * as sdk from 'botpress/sdk'

import { flatMap, flatten } from 'lodash'

import { extractPattern } from '../../tools/patterns-utils'
import { tokenize } from '../language/tokenizers'

const debug = DEBUG('nlu').sub('entities')
const debugLists = debug.sub('lists')

export default class PatternExtractor {
  constructor(private toolkit: typeof sdk.MLToolkit) {}

  async extractLists(input: string, lang: string, entityDefs: sdk.NLU.EntityDefinition[]): Promise<sdk.NLU.Entity[]> {
    return flatten(
      flatten(
        await Promise.map(entityDefs, async entityDef => {
          return await Promise.map(entityDef.occurences || [], occurence =>
            this._extractEntitiesFromOccurence(input, lang, occurence, entityDef)
          )
        })
      )
    )
  }

  protected async _extractEntitiesFromOccurence(
    input: string,
    lang: string,
    occurence: sdk.NLU.EntityDefOccurence,
    entityDef: sdk.NLU.EntityDefinition
  ): Promise<sdk.NLU.Entity[]> {
    const tokens = await tokenize(input, lang)
    const values = await Promise.map([occurence.name, ...occurence.synonyms], v => tokenize(v, lang))

    const findings: sdk.NLU.Entity[] = []

    let cur = 0
    for (const tok of tokens) {
      cur = cur + input.substr(cur).indexOf(tok)

      let highest = 0
      let extracted = ''
      let source = ''

      for (const val of values) {
        let partOfPhrase = tok
        const occ = val.join('+')
        if (val.length > 1) {
          partOfPhrase = (await tokenize(input.substr(cur, occ.length), lang)).join('+')
        }

        const d1 = this.toolkit.Strings.computeLevenshteinDistance(partOfPhrase, occ)
        const d2 = this.toolkit.Strings.computeJaroWinklerDistance(partOfPhrase, occ, { caseSensitive: true })
        let distance = Math.min(d1, d2)
        const diffLen = Math.abs(partOfPhrase.length - occ.length)

        if (!entityDef.fuzzy && distance <= 0.99) {
          distance = 0
        }

        if (diffLen <= 3) {
          distance = Math.min(1, distance * (0.1 * (4 - diffLen) + 1))
        }

        // if is closer OR if the match found is longer
        if (distance > highest || (distance === highest && extracted.length < occ.length)) {
          extracted = occ
          highest = distance
          source = input.substr(cur, partOfPhrase.length)
        }
      }

      if (highest >= 0.65) {
        debugLists('found list entity', {
          lang,
          occurence: occurence.name,
          input,
          extracted,
          confidence: highest,
          source
        })

        findings.push({
          name: entityDef.name,
          type: 'list',
          meta: {
            confidence: highest, // extrated with synonyme as patterns
            provider: 'native',
            source: source,
            start: cur,
            end: cur + source.length,
            raw: {}
          },
          data: {
            extras: { occurence: extracted },
            value: occurence.name, // cannonical value,
            unit: 'string'
          }
        })
      }
    }

    return findings
  }

  async extractPatterns(input: string, entityDefs: sdk.NLU.EntityDefinition[]): Promise<sdk.NLU.Entity[]> {
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
}

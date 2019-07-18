import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import { flatMap, flatten } from 'lodash'
import _ from 'lodash'

import { allInRange } from '../../tools/math'
import { extractPattern } from '../../tools/patterns-utils'
import { LanguageProvider } from '../../typings'
import { NLUStructure } from '../../typings'
import { sanitize } from '../language/sanitizer'

const debug = DEBUG('nlu').sub('entities')
const debugLists = debug.sub('lists')

const MIN_LENGTH_FUZZY_MATCH = 5
const MIN_CONFIDENCE = 0.65

export default class PatternExtractor {
  constructor(private toolkit: typeof sdk.MLToolkit, private languageProvider: LanguageProvider) {}

  async extractLists(ds: NLUStructure, entityDefs: sdk.NLU.EntityDefinition[]): Promise<sdk.NLU.Entity[]> {
    const entities = flatten(
      flatten(
        await Promise.mapSeries(entityDefs, async entityDef => {
          return await Promise.mapSeries(entityDef.occurences || [], occurence =>
            this._extractEntitiesFromOccurence(ds, occurence, entityDef)
          )
        })
      )
    )

    return _.orderBy(entities, ['meta.confidence'], ['desc'])
  }

  protected async _extractEntitiesFromOccurence(
    ds: NLUStructure,
    occurence: sdk.NLU.EntityDefOccurence,
    entityDef: sdk.NLU.EntityDefinition
  ): Promise<sdk.NLU.Entity[]> {
    const texts = [occurence.name, ...occurence.synonyms]
    const values = (await this.languageProvider.tokenize(texts.map(x => x.toLowerCase()), ds.language)).filter(
      x => x.length
    )

    const findings: sdk.NLU.Entity[] = []

    for (const { tok, tokenIndex } of ds.tokens.map((tok, tokenIndex) => ({ tok, tokenIndex }))) {
      const rawToken = tok.value

      let highest = 0
      let extracted = ''
      let source = ''
      let lastToken = tok

      for (const val of values) {
        let partOfPhrase: string = rawToken
        const occ = val.join('+')
        let currentLastToken = tok

        if (val.length > 1) {
          const remainingTokens = ds.tokens.slice(tokenIndex + 1)

          // TODO: try with one token less and one token more if no perfect match in length
          while (!_.isEmpty(remainingTokens) && partOfPhrase.length < occ.length) {
            const nextToken = remainingTokens.shift()
            if (!nextToken) {
              break
            }
            partOfPhrase += '+' + nextToken.value
            currentLastToken = nextToken
          }
        }

        let distance = 0.0

        const strippedPop = sanitize(partOfPhrase.toLowerCase())

        if (entityDef.fuzzy && strippedPop.length > MIN_LENGTH_FUZZY_MATCH) {
          const d1 = this.toolkit.Strings.computeLevenshteinDistance(partOfPhrase, occ)
          const d2 = this.toolkit.Strings.computeJaroWinklerDistance(partOfPhrase, occ, { caseSensitive: true })
          distance = Math.min(d1, d2)
          const diffLen = Math.abs(partOfPhrase.length - occ.length)
          if (diffLen <= 3) {
            distance = Math.min(1, distance * (0.1 * (4 - diffLen) + 1))
          }
        } else {
          const strippedOcc = sanitize(occ.toLowerCase())
          if (strippedPop.length && strippedOcc.length) {
            distance = strippedPop === strippedOcc ? 1 : 0
          }
        }

        // if is closer OR if the match found is longer
        if (distance > highest || (distance === highest && extracted.length < occ.length)) {
          extracted = occ
          highest = distance
          lastToken = currentLastToken
          source = ds.sanitizedText.substring(tok.start, lastToken.end)
        }
      }

      const start = tok.start
      const end = lastToken.end

      // prevent adding substrings of an already matched, longer entity
      // prioretize longer matches with confidence * its length higher

      const hasBiggerMatch = findings.find(
        x =>
          allInRange([start, end], x.meta.start, x.meta.end + 1) &&
          x.meta.confidence * Math.log(100 * x.meta.source.length) > highest * Math.log(100 * source.length)
      )

      if (highest >= MIN_CONFIDENCE && !hasBiggerMatch) {
        debugLists('found list entity', {
          lang: ds.language,
          occurence: occurence.name,
          input: ds.sanitizedText,
          extracted,
          confidence: highest,
          source
        })

        const newMatch = {
          name: entityDef.name,
          type: 'list',
          meta: {
            confidence: highest, // extrated with synonyme as patterns
            provider: 'native',
            source: source,
            start,
            end,
            raw: {}
          },
          data: {
            extras: { occurence: extracted },
            value: occurence.name, // cannonical value,
            unit: 'string'
          }
        }

        const idxToSwap = findings.findIndex(match => allInRange([start, end], match.meta.start, match.meta.end + 1))
        if (idxToSwap !== -1) {
          findings[idxToSwap] = newMatch
        } else {
          findings.push(newMatch)
        }
      }
    }

    return findings
  }

  async extractPatterns(input: string, entityDefs: sdk.NLU.EntityDefinition[]): Promise<sdk.NLU.Entity[]> {
    return flatMap(entityDefs, entityDef => {
      try {
        const regex = new RegExp(entityDef.pattern!, 'i')
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

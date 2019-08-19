import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import { flatMap, flatten } from 'lodash'
import _ from 'lodash'

import { allInRange } from '../../tools/math'
import { extractPattern } from '../../tools/patterns-utils'
import { LanguageProvider, Token } from '../../typings'
import { NLUStructure } from '../../typings'
import { sanitize } from '../language/sanitizer'

const debug = DEBUG('nlu').sub('entities')
const debugLists = debug.sub('lists')

const MIN_LENGTH_FUZZY_MATCH = 5
const MIN_CONFIDENCE = 0.65

interface PartOfPhrase {
  firstToken: Token
  lastToken: Token
  value: string
  occ: string
  distance?: number
}

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
      let highest = 0
      let extracted = ''
      let source = ''
      let currentFirstToken = tok
      let currentLastToken = tok

      for (const val of values) {
        const remainingTokens = ds.tokens.slice(tokenIndex)
        const results = this.extractPartOfPhrase(remainingTokens, val)

        const partOfPhrase = _.chain(results)
          .map(pop => ({
            ...pop,
            distance: this.calculateDistance(pop.value, pop.occ, entityDef)
          }))
          .maxBy('distance')
          .value()

        const { distance, lastToken, firstToken, occ } = partOfPhrase

        // if is closer OR if the match found is longer
        if (distance > highest || (distance === highest && extracted.length < occ.length)) {
          extracted = occ
          highest = distance
          currentFirstToken = firstToken
          currentLastToken = lastToken
          source = ds.sanitizedText.substring(firstToken.start, lastToken.end)
        }
      }

      const start = currentFirstToken.start
      const end = currentLastToken.end

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

  private extractPartOfPhrase(remainingTokens: Token[], searched: string[]): PartOfPhrase[] {
    const occ = searched.join('')
    let firstToken = remainingTokens.shift()
    let lastToken = firstToken

    if (!firstToken) {
      return []
    }

    let partOfPhrase: string = firstToken.value

    if (searched.length > 1) {
      let previous: string
      while (!_.isEmpty(remainingTokens)) {
        const nextToken = remainingTokens.shift()
        if (!nextToken) {
          return [{ firstToken, lastToken, value: partOfPhrase, occ }]
        }
        previous = partOfPhrase
        partOfPhrase += nextToken.value

        if (partOfPhrase.length === occ.length) {
          return [{ firstToken, lastToken: nextToken, value: partOfPhrase, occ }]
        }

        if (partOfPhrase.length > occ.length) {
          const oneTokenLess = previous
          const oneTokenMore = partOfPhrase

          return [
            { firstToken, lastToken, value: oneTokenLess, occ },
            { firstToken, lastToken: nextToken, value: oneTokenMore, occ }
          ]
        }

        lastToken = nextToken
      }
    }

    return [{ firstToken, lastToken, value: partOfPhrase, occ }]
  }

  private calculateDistance(a: string, b: string, { fuzzy }: sdk.NLU.EntityDefinition): number {
    return fuzzy && sanitize(a.toLowerCase()).length > MIN_LENGTH_FUZZY_MATCH
      ? this.calculateFuzzyDistance(a, b)
      : this.calculateExactDistance(a, b)
  }

  private calculateExactDistance(a: string, b: string): number {
    const strippedPop = sanitize(a.toLowerCase())
    const strippedOcc = sanitize(b.toLowerCase())
    if (strippedPop.length && strippedOcc.length) {
      return strippedPop === strippedOcc ? 1 : 0
    }
    return 0
  }

  private calculateFuzzyDistance(a: string, b: string): number {
    let distance = 0.0

    const d1 = this.toolkit.Strings.computeLevenshteinDistance(a, b)
    const d2 = this.toolkit.Strings.computeJaroWinklerDistance(a, b, { caseSensitive: true })

    distance = Math.min(d1, d2)
    const diffLen = Math.abs(a.length - b.length)
    if (diffLen <= 3) {
      distance = Math.min(1, distance * (0.1 * (4 - diffLen) + 1)) // gives a chance to small differences in length: "apple" vs "apples,". Both distances functions are already normalized in domain [0, 1]
    }

    return distance
  }

  async extractPatterns(input: string, entityDefs: sdk.NLU.EntityDefinition[]): Promise<sdk.NLU.Entity[]> {
    return flatMap(entityDefs, entityDef => {
      try {
        const regex = new RegExp(entityDef.pattern!, 'i')
        return extractPattern(input, regex, []).map(res => ({
          name: entityDef.name,
          type: entityDef.type, // pattern
          sensitive: entityDef.sensitive,
          meta: {
            confidence: 1, // pattern always has 1 confidence
            provider: 'native',
            source: res.value,
            start: Math.max(0, res.sourceIndex),
            end: Math.min(input.length, res.sourceIndex + res.value.length),
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

import _ from 'lodash'

import { extractPattern } from '../tools/patterns-utils'
import { jaroWinklerSimilarity, levenshteinSimilarity } from '../tools/strings'
import { EntityExtractionResult, ListEntityModel, PatternEntity, WarmedListEntityModel } from '../typings'
import Utterance, { UtteranceToken } from '../utterance/utterance'

const ENTITY_SCORE_THRESHOLD = 0.6

function takeUntil(
  arr: ReadonlyArray<UtteranceToken>,
  start: number,
  desiredLength: number
): ReadonlyArray<UtteranceToken> {
  let total = 0
  const result = _.takeWhile(arr.slice(start), t => {
    const toAdd = t.toString().length
    const current = total
    if (current > 0 && Math.abs(desiredLength - current) < Math.abs(desiredLength - current - toAdd)) {
      // better off as-is
      return false
    } else {
      // we're closed to desired if we add a new token
      total += toAdd
      return current < desiredLength
    }
  })
  if (result[result.length - 1].isSpace) {
    result.pop()
  }
  return result
}

function computeExactScore(a: string[], b: string[]): number {
  const str1 = a.join('')
  const str2 = b.join('')
  const min = Math.min(str1.length, str2.length)
  const max = Math.max(str1.length, str2.length)
  let score = 0
  for (let i = 0; i < min; i++) {
    if (str1[i] === str2[i]) {
      score++
    }
  }
  return score / max
}

function computeFuzzyScore(a: string[], b: string[]): number {
  const str1 = a.join('')
  const str2 = b.join('')
  const d1 = levenshteinSimilarity(str1, str2)
  const d2 = jaroWinklerSimilarity(str1, str2, { caseSensitive: false })
  return (d1 + d2) / 2
}

function computeStructuralScore(a: string[], b: string[]): number {
  const charset1 = _.uniq(_.flatten(a.map(x => x.split(''))))
  const charset2 = _.uniq(_.flatten(b.map(x => x.split(''))))
  const charset_score = _.intersection(charset1, charset2).length / _.union(charset1, charset2).length
  const charsetLow1 = charset1.map(c => c.toLowerCase())
  const charsetLow2 = charset2.map(c => c.toLowerCase())
  const charset_low_score = _.intersection(charsetLow1, charsetLow2).length / _.union(charsetLow1, charsetLow2).length
  const final_charset_score = _.mean([charset_score, charset_low_score])

  const la = Math.max(1, a.filter(x => x.length > 1).length)
  const lb = Math.max(1, a.filter(x => x.length > 1).length)
  const token_qty_score = Math.min(la, lb) / Math.max(la, lb)

  const size1 = _.sumBy(a, 'length')
  const size2 = _.sumBy(b, 'length')
  const token_size_score = Math.min(size1, size2) / Math.max(size1, size2)

  return Math.sqrt(final_charset_score * token_qty_score * token_size_score)
}

interface SplittedModels {
  withCacheHit: WarmedListEntityModel[]
  withCacheMiss: WarmedListEntityModel[]
}

function splitModelsByCacheHitOrMiss(listModels: WarmedListEntityModel[], cacheKey: string): SplittedModels {
  return listModels.reduce(
    ({ withCacheHit, withCacheMiss }, nextModel) => {
      if (nextModel.cache.has(cacheKey)) {
        withCacheHit.push(nextModel)
      } else {
        withCacheMiss.push(nextModel)
      }
      return { withCacheHit, withCacheMiss }
    },
    { withCacheHit: [], withCacheMiss: [] } as SplittedModels
  )
}

interface Candidate {
  score: number
  canonical: string
  start: number
  end: number
  source: string
  occurrence: string
  eliminated: boolean
}

function extractForListModel(utterance: Utterance, listModel: ListEntityModel): EntityExtractionResult[] {
  const candidates: Candidate[] = []
  let longestCandidate = 0

  for (const [canonical, occurrences] of _.toPairs(listModel.mappingsTokens)) {
    for (const occurrence of occurrences) {
      for (let i = 0; i < utterance.tokens.length; i++) {
        if (utterance.tokens[i].isSpace) {
          continue
        }
        const workset = takeUntil(utterance.tokens, i, _.sumBy(occurrence, 'length'))
        const worksetStrLow = workset.map(x => x.toString({ lowerCase: true, realSpaces: true, trim: false }))
        const worksetStrWCase = workset.map(x => x.toString({ lowerCase: false, realSpaces: true, trim: false }))
        const candidateAsString = occurrence.join('')

        if (candidateAsString.length > longestCandidate) {
          longestCandidate = candidateAsString.length
        }

        const exact_score = computeExactScore(worksetStrWCase, occurrence) === 1 ? 1 : 0
        const fuzzy = listModel.fuzzyTolerance < 1 && worksetStrLow.join('').length >= 4
        const fuzzy_score = computeFuzzyScore(
          worksetStrLow,
          occurrence.map(t => t.toLowerCase())
        )
        const fuzzy_factor = fuzzy_score >= listModel.fuzzyTolerance ? fuzzy_score : 0
        const structural_score = computeStructuralScore(worksetStrWCase, occurrence)
        const finalScore = fuzzy ? fuzzy_factor * structural_score : exact_score * structural_score

        candidates.push({
          score: _.round(finalScore, 2),
          canonical,
          start: i,
          end: i + workset.length - 1,
          source: workset.map(t => t.toString({ lowerCase: false, realSpaces: true })).join(''),
          occurrence: occurrence.join(''),
          eliminated: false
        })
      }
    }

    for (let i = 0; i < utterance.tokens.length; i++) {
      const results = _.orderBy(
        candidates.filter(x => !x.eliminated && x.start <= i && x.end >= i),
        // we want to favor longer matches (but is obviously less important than score)
        // so we take its length into account (up to the longest candidate)
        x => x.score * Math.pow(Math.min(x.source.length, longestCandidate), 1 / 5),
        'desc'
      )
      if (results.length > 1) {
        const [, ...losers] = results
        losers.forEach(x => (x.eliminated = true))
      }
    }
  }

  return candidates
    .filter(x => !x.eliminated && x.score >= ENTITY_SCORE_THRESHOLD)
    .map(match => ({
      confidence: match.score,
      start: utterance.tokens[match.start].offset,
      end: utterance.tokens[match.end].offset + utterance.tokens[match.end].value.length,
      value: match.canonical,
      metadata: {
        extractor: 'list',
        source: match.source,
        occurrence: match.occurrence,
        entityId: listModel.id
      },
      sensitive: listModel.sensitive,
      type: listModel.entityName
    })) as EntityExtractionResult[]
}

export const extractListEntities = (
  utterance: Utterance,
  list_entities: ListEntityModel[]
): EntityExtractionResult[] => {
  return _(list_entities)
    .map(model => extractForListModel(utterance, model))
    .flatten()
    .value()
}

export const extractListEntitiesWithCache = (
  utterance: Utterance,
  list_entities: WarmedListEntityModel[]
): EntityExtractionResult[] => {
  // no need to "keep-value" of entities as this function's purpose is precisly to extract entities before tagging them in the utterance.
  const cacheKey = utterance.toString({ lowerCase: true })
  const { withCacheHit, withCacheMiss } = splitModelsByCacheHitOrMiss(list_entities, cacheKey)

  const cachedMatches: EntityExtractionResult[] = _.flatMap(withCacheHit, listModel => listModel.cache.get(cacheKey)!)

  const extractedMatches: EntityExtractionResult[] = _(withCacheMiss)
    .map(model => {
      const extractions = extractForListModel(utterance, model)
      model.cache.set(cacheKey, extractions)
      return extractions
    })
    .flatten()
    .value()

  return [...cachedMatches, ...extractedMatches]
}

export const extractPatternEntities = (
  utterance: Utterance,
  pattern_entities: PatternEntity[]
): EntityExtractionResult[] => {
  const input = utterance.toString()
  // taken from pattern_extractor
  return _.flatMap(pattern_entities, ent => {
    const regex = new RegExp(ent.pattern!, ent.matchCase ? '' : 'i')

    return extractPattern(input, regex, []).map(res => ({
      confidence: 1,
      start: Math.max(0, res.sourceIndex),
      end: Math.min(input.length, res.sourceIndex + res.value.length),
      value: res.value,
      metadata: {
        extractor: 'pattern',
        source: res.value,
        entityId: `custom.pattern.${ent.name}`
      },
      sensitive: ent.sensitive,
      type: ent.name
    }))
  })
}

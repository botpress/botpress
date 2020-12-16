import _ from 'lodash'

const HORIZONTAL_ELLIPSIS = '\u2026'
const THREE_DOTS = '...'

/** Splits a string in all its N-grams */
export function ngram(value: string, n: number): string[] {
  const nGrams: string[] = []
  let index = value.length - n + 1

  while (index--) {
    nGrams.push(value.slice(index, index + n))
  }

  return nGrams
}

export function vocabNGram(tokens: string[]): string[] {
  const plainTokens = tokens
    .map(x => x.replace('\u2581', '')) // We want to discover real language-specific chars
    .filter(x => x.length > 1) // We want to exclude tokens that represent ponctuation etc (tokenizers will often split them alone)

  // We build a gramset, which is essentially a list of all the unique bigrams and trigrams
  // We'll create entirely new words from those grams
  const gramset = _.chain(plainTokens)
    .map(x => [ngram(x, 1), ngram(x, 2)])
    .flattenDeep()
    .uniq()
    .value()

  return (gramset as never) as string[]
}

/** Returns the similarity of two sets of strings in percentage */
export function setSimilarity(a: string[], b: string[]): number {
  const common = _.intersection(a, b).length
  return common / (a.length + b.length - common)
}

/**
 * Returns the jaro-winkler similarity between two strings
 * @param s1 String A
 * @param s2 String B
 * @returns A number between 0 and 1, where 1 means very similar
 */
export function jaroWinklerSimilarity(
  s1: string,
  s2: string,
  options: { caseSensitive: boolean } = { caseSensitive: true }
): number {
  let m = 0

  let i: number
  let j: number

  // Exit early if either are empty.
  if (s1.length === 0 || s2.length === 0) {
    return 0
  }

  // Convert to upper if case-sensitive is false.
  if (!options.caseSensitive) {
    s1 = s1.toUpperCase()
    s2 = s2.toUpperCase()
  }

  // Exit early if they're an exact match.
  if (s1 === s2) {
    return 1
  }

  const range = Math.floor(Math.max(s1.length, s2.length) / 2) - 1
  const s1Matches: boolean[] = new Array(s1.length).fill(false)
  const s2Matches: boolean[] = new Array(s2.length).fill(false)

  for (i = 0; i < s1.length; i++) {
    const low = i >= range ? i - range : 0
    const high = i + range <= s2.length - 1 ? i + range : s2.length - 1

    for (j = low; j <= high; j++) {
      if (s1Matches[i] !== true && s2Matches[j] !== true && s1[i] === s2[j]) {
        ++m
        s1Matches[i] = s2Matches[j] = true
        break
      }
    }
  }

  // Exit early if no matches were found.
  if (m === 0) {
    return 0
  }

  // Count the transpositions.
  let k = 0
  let numTrans = 0

  for (i = 0; i < s1.length; i++) {
    if (s1Matches[i] === true) {
      for (j = k; j < s2.length; j++) {
        if (s2Matches[j] === true) {
          k = j + 1
          break
        }
      }

      if (s1[i] !== s2[j]) {
        ++numTrans
      }
    }
  }

  let weight = (m / s1.length + m / s2.length + (m - numTrans / 2) / m) / 3
  let l = 0
  const p = 0.1

  if (weight > 0.7) {
    while (s1[l] === s2[l] && l < 4) {
      ++l
    }

    weight = weight + l * p * (1 - weight)
  }

  return weight
}

/**
 * Returns the levenshtein similarity between two strings
 * sim(a, b) = (|b| - dist(a, b)) / |b| where |a| < |b|
 * sim(a, b) ∈ [0, 1]
 * @returns the proximity between 0 and 1, where 1 is very close
 */
export function levenshteinSimilarity(a: string, b: string): number {
  const len = Math.max(a.length, b.length)
  const dist = levenshtein(a, b)
  return (len - dist) / len
}

export function levenshtein(a: string, b: string): number {
  if (a.length === 0 || b.length === 0) {
    return 0
  }

  if (a.length > b.length) {
    const tmp = a
    a = b
    b = tmp
  }

  let i: number,
    j: number,
    res: number = 0

  const alen = a.length,
    blen = b.length,
    row = [...Array(alen + 1).keys()]

  let tmp: number
  for (i = 1; i <= blen; i++) {
    res = i
    for (j = 1; j <= alen; j++) {
      tmp = row[j - 1]
      row[j - 1] = res
      res = b[i - 1] === a[j - 1] ? tmp : Math.min(tmp + 1, res + 1, row[j] + 1)
    }
  }

  return res
}

/**
 * @param a string
 * @param b string
 * @returns the # of operations required to go from a to b but consider letter swap as 1
 * @see {@link https://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance#Distance_with_adjacent_transpositions} for more info
 */
export function damerauLevenshtein(a: string, b: string) {
  const an = a ? a.length : 0
  const bn = b ? b.length : 0
  if (an === 0) {
    return bn
  }
  if (bn === 0) {
    return an
  }

  const maxDist = an + bn
  const matrix = new Array(an + 2)
  const alphaMap = {}
  for (let i = 0; i < an + 2; i++) {
    matrix[i] = new Array(bn + 2)
  }
  matrix[0][0] = maxDist
  for (let i = 0; i <= an; i++) {
    matrix[i + 1][1] = i
    matrix[i + 1][0] = maxDist
    alphaMap[a[i]] = 0
  }
  for (let j = 0; j <= bn; j++) {
    matrix[1][j + 1] = j
    matrix[0][j + 1] = maxDist
    alphaMap[b[j]] = 0
  }

  for (let i = 1; i <= an; i++) {
    let DB = 0
    for (let j = 1; j <= bn; j++) {
      const k = alphaMap[b[j - 1]]
      const l = DB
      let cost: number
      if (a[i - 1] === b[j - 1]) {
        cost = 0
        DB = j
      } else {
        cost = 1
      }
      matrix[i + 1][j + 1] = Math.min(
        matrix[i][j] + cost, // substitution
        matrix[i + 1][j] + 1, // insertion
        matrix[i][j + 1] + 1, // deletion
        matrix[k] ? matrix[k][l] + (i - k - 1) + 1 + (j - l - 1) : Infinity // transposition
      )
    }
    alphaMap[a[i - 1]] = i
  }
  return matrix[an + 1][bn + 1]
}

/**
 * @returns number of alpha characters in a string
 */
export const countAlpha = (cantidate: string): number =>
  (
    cantidate
      .toLowerCase()
      .replace(/\s/g, '')
      .match(/[a-z]/g) || []
  ).length

/**
 * @returns number of digits characters in a string
 */
export const countNum = (candidate: string): number => (candidate.replace(/\s/g, '').match(/[0-9]/g) || []).length

/**
 * @returns number of special characters in a string
 */
export const countSpecial = (candidate: string): number =>
  candidate.replace(/\s/g, '').length - countAlpha(candidate) - countNum(candidate)

export const replaceConsecutiveSpaces = (input: string): string => input.replace(/(\s)+/g, ' ')

export const replaceEllipsis = (input: string): string =>
  input.replace(new RegExp(HORIZONTAL_ELLIPSIS, 'g'), THREE_DOTS)

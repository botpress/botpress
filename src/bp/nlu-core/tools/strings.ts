import _ from 'lodash'

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
 * Returns the levenshtein distance between two strings
 * @returns the # of operations required to go from a to b
 */
export function levenshtein(a: string, b: string): number {
  const an = a ? a.length : 0
  const bn = b ? b.length : 0
  if (an === 0) {
    return bn
  }
  if (bn === 0) {
    return an
  }
  const matrix = new Array<number[]>(bn + 1)
  for (let i = 0; i <= bn; ++i) {
    const row = (matrix[i] = new Array<number>(an + 1))
    row[0] = i
  }
  const firstRow = matrix[0]
  for (let j = 1; j <= an; ++j) {
    firstRow[j] = j
  }
  for (let i = 1; i <= bn; ++i) {
    for (let j = 1; j <= an; ++j) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] =
          Math.min(
            matrix[i - 1][j - 1], // substitution
            matrix[i][j - 1], // insertion
            matrix[i - 1][j] // deletion
          ) + 1
      }
    }
  }
  return matrix[bn][an]
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

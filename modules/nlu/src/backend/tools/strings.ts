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
 * Duplicate of `src/bp/ml/homebrew/leveinsthein`, remove/refactor if/when we merge NLU into core
 * @returns the # of operations required to go from a to b
 */
export function levenshtein(a: string, b: string): number {
  let tmp

  if (a.length === 0) {
    return b.length
  }
  if (b.length === 0) {
    return a.length
  }
  if (a.length > b.length) {
    tmp = a
    a = b
    b = tmp
  }

  let i: number,
    j: number,
    res: number = 0

  const alen = a.length,
    blen = b.length,
    row = Array(alen)

  for (i = 0; i <= alen; i++) {
    row[i] = i
  }

  for (i = 1; i <= blen; i++) {
    res = i
    for (j = 1; j <= alen; j++) {
      tmp = row[j - 1]
      row[j - 1] = res
      res = b[i - 1] === a[j - 1] ? tmp : Math.min(tmp + 1, Math.min(res + 1, row[j] + 1))
    }
  }

  return res
}

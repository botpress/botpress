/** Splits a string in all its N-grams */
export function ngram(value: string, n: number): string[] {
  const nGrams: string[] = []
  let index = value.length - n + 1

  while (index--) {
    nGrams.push(value.slice(index, index + n))
  }

  return nGrams
}

/**
 * Returns the levenshtein distance between two strings
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

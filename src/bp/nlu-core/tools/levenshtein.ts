/**
 * Returns the levenshtein similarity between two strings
 * @returns the proximity between 0 and 1, where 1 is very close
 */
export default (a: string, b: string): number => {
  let tmp

  if (a.length === 0 || b.length === 0) {
    return 0
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
    row = [...Array(alen + 1).keys()]

  for (i = 1; i <= blen; i++) {
    res = i
    for (j = 1; j <= alen; j++) {
      tmp = row[j - 1]
      row[j - 1] = res
      res = b[i - 1] === a[j - 1] ? tmp : Math.min(tmp + 1, res + 1, row[j] + 1)
    }
  }

  return (alen - res) / alen
}

import _ from 'lodash'

export function ndistance(a: number[], b: number[]): number {
  let total = 0
  for (let i = 0; i < a.length; i++) {
    const diff = b[i] - a[i]
    total += diff * diff
  }
  return Math.sqrt(total)
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

export function GetZPercent(z) {
  if (z < -6.5) {
    return 0.0
  }

  if (z > 6.5) {
    return 1.0
  }

  let factK = 1
  let sum = 0
  let term = 1
  let k = 0
  const loopStop = Math.exp(-23)

  while (Math.abs(term) > loopStop) {
    term =
      (((0.3989422804 * Math.pow(-1, k) * Math.pow(z, k)) / (2 * k + 1) / Math.pow(2, k)) * Math.pow(z, k + 1)) / factK
    sum += term
    k++
    factK *= k
  }

  sum += 0.5

  return sum
}

export function computeNorm(vec: number[]): number {
  return Math.sqrt(vec.reduce((acc, next) => acc + Math.pow(next, 2), 0))
}

function add(...args: number[]) {
  return args.reduce(_.add, 0)
}

export function vectorAdd(...args: number[][]): number[] {
  for (const vec of args) {
    if (vec.length !== args[0].length) {
      throw new Error('dimensions should match')
    }
  }

  return _.zipWith(...args, add)
}

export function scalarMultiply(vec: number[], multiplier: number): number[] {
  return vec.map(x => x * multiplier)
}

export function scalarDivide(vec: number[], divider: number): number[] {
  return scalarMultiply(vec, 1 / divider)
}

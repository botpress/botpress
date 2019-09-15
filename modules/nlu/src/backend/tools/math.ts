import _ from 'lodash'

/**
 * Vectorial distance between two N-dimentional points
 * a[] and b[] must be of same dimention
 */
export function ndistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Can't calculate distance between vectors of different length (${a.length} vs ${b.length})`)
  }

  let total = 0
  for (let i = 0; i < a.length; i++) {
    const diff = b[i] - a[i]
    total += diff * diff
  }
  return Math.sqrt(total)
}

export function GetZPercent(z: number) {
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

export function allInRange(vec: number[], lower: number, upper: number): boolean {
  return vec.map(v => _.inRange(v, lower, upper)).every(_.identity)
}

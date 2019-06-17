import _ from 'lodash'

// TODO add unit test for this
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

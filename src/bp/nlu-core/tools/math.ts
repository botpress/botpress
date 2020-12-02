import _ from 'lodash'
import { log, mean, std } from 'mathjs'

// TODO: remove all theses functions and use mathjs instead

export function euclideanDistanceSquared(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Can't calculate distance between vectors of different length (${a.length} vs ${b.length})`)
  }

  let total = 0
  for (let i = 0; i < a.length; i++) {
    const diff = b[i] - a[i]
    total += diff * diff
  }
  return total
}

/**
 * Vectorial distance between two N-dimentional points
 * a[] and b[] must be of same dimention
 */
export function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(euclideanDistanceSquared(a, b))
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

export function averageVectors(vecs: number[][]): number[] {
  if (!vecs.length) {
    return []
  }

  if (_.uniqBy(vecs, 'length').length > 1) {
    throw new Error('Vectors must all be of the same size')
  }

  const normalized: number[][] = vecs
    .map(vec => {
      const norm = computeNorm(vec)
      if (norm) {
        return scalarDivide(vec, norm)
      }
    })
    .filter(Boolean) as number[][]
  return vectorAdd(...normalized)
}

export function scalarDivide(vec: number[], divider: number): number[] {
  return scalarMultiply(vec, 1 / divider)
}

export function zeroes(len: number): number[] {
  return Array(len).fill(0)
}

/**
 * @param quantile number of discret categories ex: 4 == quartile
 * @param target value to classify
 * @param upperBound maximum value the target can take
 * @param lowerBound minimum value the target can take
 * @returns integer value between [1, quantile]
 */
export function computeQuantile(quantile: number, target: number, upperBound: number, lowerBound: number = 0): number {
  return Math.min(quantile, Math.max(Math.ceil(quantile * ((target - lowerBound) / (upperBound - lowerBound))), 1))
}

export { log, std, mean }

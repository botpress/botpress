import _ from 'lodash'

export const fail = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
export const isIn = (x: number, [min, max]: [number, number]) => x >= min && x <= max

const summary = (x: string, l = 20) => (x.length > l ? `${x.slice(0, l)}...` : x)

export class ExpectError extends Error {}
export const expect = <T>(x: T) => ({
  toBe: (y: T) => {
    if (!_.isEqual(x, y)) {
      const xStr = summary(JSON.stringify(x), Infinity)
      const yStr = summary(JSON.stringify(y), Infinity)
      throw new ExpectError(`Expected ${xStr} to be ${yStr}`)
    }
  },
  toBeTruthy: () => {
    if (!x) {
      throw new ExpectError(`Expected ${x} to be truthy`)
    }
  },
  toThrow: () => {
    if (typeof x !== 'function') {
      throw new ExpectError(`Expected ${x} to be a function`)
    }

    let didThrow = false
    try {
      x()
    } catch (err) {
      didThrow = true
    }

    if (!didThrow) {
      throw new ExpectError(`Expected ${x} to throw`)
    }
  },
})

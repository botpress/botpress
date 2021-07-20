import ms from 'ms'

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message)
  }
}

export const timeoutFn = async <R>(promise: Promise<R>, timeout?: string): Promise<R> => {
  if (timeout) {
    const timePromise = new Promise((_resolve, reject) => {
      setTimeout(() => reject(new TimeoutError(`Timeout of ${timeout} exceeded`)), ms(timeout))
    })

    const response = await Promise.race([timePromise, promise])

    return response as R
  } else {
    return promise
  }
}

export const closest = (arr: number[], value: number) => {
  return arr.reduce((prev, curr) => {
    const diffPref = Math.abs(prev - value)
    const diffCurr = Math.abs(curr - value)

    if (diffPref === diffCurr) {
      return prev > curr ? prev : curr
    } else {
      return diffCurr < diffPref ? curr : prev
    }
  })
}

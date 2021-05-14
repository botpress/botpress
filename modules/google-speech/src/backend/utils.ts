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

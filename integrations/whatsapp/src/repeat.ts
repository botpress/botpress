import { sleep } from './misc/util'

export type RepeatResult<T> = {
  repeat: boolean
  result: T
}

export type RepeatCallback<T> = (iteration: number) => Promise<RepeatResult<T>>
export type BackoffCallback<T> = (iteration: number, result: T) => number

export type RepeatOptions<T> = {
  maxIterations: number
  backoff: BackoffCallback<T>
}

/**
 * Like a retry function, but with a slightly different semantics.
 * The callback function is repeated based on its return value, not on whether it throws or not.
 */
export const repeat = async <T>(callback: RepeatCallback<T>, options: RepeatOptions<T>): Promise<T> => {
  let iteration = 0
  for (;;) {
    const res = await callback(iteration)
    if (!res.repeat) {
      return res.result
    }

    iteration++
    if (iteration >= options.maxIterations) {
      return res.result
    }

    const delay = options.backoff(iteration, res.result)
    await sleep(delay)
  }
}

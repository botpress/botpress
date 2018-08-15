import 'bluebird-global'
import _ from 'lodash'
import ms from 'ms'

type MiddlewareChainOptions = {
  timeoutInMs: number
}

const defaultOptions = {
  timeoutInMs: ms('1s')
}

export const MiddlewareChain = <T>(options: MiddlewareChainOptions = defaultOptions) => {
  const stack: Function[] = []
  options = { ...defaultOptions, ...options }

  const use = (fn: Function) => {
    stack.push(fn)
  }

  // for ( stack ... 0 --> m )
  // Call fn(event, next)
  // If next called ? continue loop
  // If not after "x" ms, stop the loop

  const run = async (event: T) => {
    for (const mw of stack) {
      let timedOut = false
      const timePromise = new Promise(() => {}).timeout(options.timeoutInMs).catch(() => {
        timedOut = true
      })
      const mwPromise = Promise.fromCallback(cb => mw(event, cb))
      await Promise.race([timePromise, mwPromise])
      if (timedOut) {
        break
      }
    }
  }

  return { use, run }
}

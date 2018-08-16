import _ from 'lodash'
import ms from 'ms'

type MiddlewareChainOptions = {
  timeoutInMs: number
}

const defaultOptions = {
  timeoutInMs: ms('1s')
}

export class MiddlewareChain<T> {
  private stack: Function[] = []

  constructor(private options: MiddlewareChainOptions = defaultOptions) {
    options = { ...defaultOptions, ...options }
  }

  use(fn: Function) {
    this.stack.push(fn)
  }

  async run(event: T) {
    for (const mw of this.stack) {
      let timedOut = false
      const timePromise = new Promise(() => {}).timeout(this.options.timeoutInMs).catch(() => {
        timedOut = true
      })
      const mwPromise = Promise.fromCallback(cb => mw(event, cb))
      await Promise.race([timePromise, mwPromise])
      if (timedOut) {
        break
      }
    }
  }
}

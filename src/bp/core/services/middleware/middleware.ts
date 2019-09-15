import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import ms from 'ms'

type MiddlewareChainOptions = {
  timeoutInMs: number
}

const defaultOptions = {
  timeoutInMs: ms('2s')
}

export class MiddlewareChain {
  private stack: sdk.IO.MiddlewareHandler[] = []

  constructor(private options: MiddlewareChainOptions = defaultOptions) {
    this.options = { ...defaultOptions, ...options }
  }

  use(fn: sdk.IO.MiddlewareHandler) {
    this.stack.push(fn)
  }

  async run(event: sdk.IO.Event) {
    for (const mw of this.stack) {
      let timedOut = false
      const timePromise = new Promise(() => {}).timeout(this.options.timeoutInMs).catch(() => {
        timedOut = true
      })
      const mwPromise = Promise.fromCallback<boolean>(cb => mw(event, cb))
      const result = await Promise.race([timePromise, mwPromise])
      if (timedOut) {
        break
      } else if (typeof result !== 'undefined') {
        // middleware calling next(null, false) will swallow the event
        if (!result) {
          break
        }
      }
    }
  }
}

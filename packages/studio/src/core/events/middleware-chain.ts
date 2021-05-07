import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import ms from 'ms'

import { addStepToEvent, StepScopes, StepStatus } from './utils'

interface MiddlewareChainOptions {
  timeoutInMs: number
}

interface MiddlewareProperties {
  mw: sdk.IO.MiddlewareHandler
  name: string
  timeoutInMs: number
}

const defaultOptions = {
  timeoutInMs: ms('2s')
}

export class MiddlewareChain {
  private stack: MiddlewareProperties[] = []

  constructor(private options: MiddlewareChainOptions = defaultOptions) {
    this.options = { ...defaultOptions, ...options }
  }

  use({ handler, name, timeout }: sdk.IO.MiddlewareDefinition) {
    const timeoutInMs = timeout ? ms(timeout) : this.options.timeoutInMs
    this.stack.push({ mw: handler, name, timeoutInMs })
  }

  async run(event: sdk.IO.Event) {
    for (const { mw, name, timeoutInMs } of this.stack) {
      let timedOut = false
      const timePromise = new Promise(() => {}).timeout(timeoutInMs).catch(() => {
        timedOut = true
      })
      const mwPromise = Promise.fromCallback<boolean>(cb => mw(event, cb), { multiArgs: true })
      const result = await Promise.race<Boolean[]>([timePromise, mwPromise])

      if (timedOut) {
        addStepToEvent(event, StepScopes.Middleware, name, StepStatus.TimedOut)
        continue
      } else if (typeof result !== 'undefined') {
        const [swallow, skipped] = result as Boolean[]

        if (swallow) {
          addStepToEvent(event, StepScopes.Middleware, name, StepStatus.Swallowed)
          break
        } else if (skipped) {
          addStepToEvent(event, StepScopes.Middleware, name, StepStatus.Skipped)
        } else {
          addStepToEvent(event, StepScopes.Middleware, name, StepStatus.Completed)
        }
      }
    }
  }
}

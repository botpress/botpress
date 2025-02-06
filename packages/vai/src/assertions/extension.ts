import json5 from 'json5'
import { expect } from 'vitest'
import { getCurrentTest } from 'vitest/suite'

import { asyncExpect } from '../utils/asyncAssertion'
import { Output } from '../utils/predictJson'

export type ExtendedPromise<T> = PromiseLike<Output<T>> & {
  value: PromiseLike<T>
}

export const toAssertion = <T>(promise: Promise<Output<T>>): ExtendedPromise<T> => {
  return {
    then: promise.then.bind(promise),
    value: promise.then((value) => value.result),
  }
}

export const makeToMatchInlineSnapshot =
  <T>(promise: Promise<Output<T>>) =>
  async (expected?: string) => {
    const stack = new Error().stack!.split('\n')[2]
    const newStack = `
at __INLINE_SNAPSHOT__ (node:internal/process/task_queues:1:1)
at randomLine (node:internal/process/task_queues:1:1)
${stack}
`.trim()

    const obj = json5.parse(expected ?? '""')
    const expectation = asyncExpect(promise, (expect) => expect.toMatchObject(obj)).catch(() => {
      // we swallow the error here, as we're going to throw a new one with the correct stack
      // this is just to make vitest happy and show a nice error message
    })

    try {
      expect((await promise).result).toMatchObject(obj)
    } catch {
      const newError = new Error()
      newError.stack = newStack

      expect.getState().snapshotState.match({
        isInline: true,
        received: (await promise).result,
        testName: getCurrentTest()!.name,
        error: newError,
        inlineSnapshot: expected,
      })
    }

    return expectation
  }

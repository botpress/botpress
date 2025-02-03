import { Assertion, expect } from 'vitest'
import { getCurrentTest } from 'vitest/suite'
import { Context } from '../context'
import { Output } from './predictJson'

export class AsyncExpectError<T> extends Error {
  public constructor(
    message: string,
    public readonly output: Output<T>
  ) {
    super(message)
    this.name = 'AsyncExpectError'
  }
}

const getErrorMessages = (e: unknown): string => {
  if (e instanceof Error) {
    return e.message
  } else if (typeof e === 'string') {
    return e
  } else if (typeof e === 'object' && e !== null) {
    return JSON.stringify(e)
  }

  return `Unknown error: ${e}`
}

export const asyncExpect = <T>(output: Promise<Output<T>>, assertion: (assert: Assertion<T>) => void) => {
  const promise = output.then((x) => {
    try {
      assertion(expect(x.result, x.reason))
    } catch (e: unknown) {
      if (Context.wrapError) {
        return new AsyncExpectError<T>(getErrorMessages(e), x)
      }
      throw e
    }
    return x
  })
  const currentTest = getCurrentTest()

  if (currentTest) {
    currentTest.promises ??= []
    currentTest.promises.push(promise)
  }

  return promise
}

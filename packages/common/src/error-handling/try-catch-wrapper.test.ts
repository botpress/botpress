import { RuntimeError } from '@botpress/sdk'
import {
  createAsyncFnWrapperWithErrorRedaction,
  createErrorHandlingDecorator,
  InvalidAsyncFunctionArgumentError,
} from './try-catch-wrapper'
import { expect, test } from 'vitest'

const _errorRedactor = (error: Error, customMessage: string): RuntimeError =>
  new RuntimeError(`${error.message}: ${customMessage}`)

export const wrapAsyncFnWithTryCatch = createAsyncFnWrapperWithErrorRedaction(_errorRedactor)
export const handleErrors = createErrorHandlingDecorator(wrapAsyncFnWithTryCatch)

export class MyClient {
  @handleErrors('hello1')
  public syncSuccessMethod() {
    return 'banana'
  }

  @handleErrors('hello2')
  public syncFailureMethod() {
    throw new Error('oops')
  }

  @handleErrors('hello3')
  public async asyncSuccessMethod() {
    return 'apple'
  }

  @handleErrors('hello4')
  public async asyncFailureMethod() {
    throw new Error('oops')
  }
}

test('decorating successfull async methods shouldnt change their behavior', async () => {
  const client = new MyClient()
  expect(await client.asyncSuccessMethod()).toBe('apple')
})

test('decorating failed async methods should redact the error', async () => {
  const client = new MyClient()

  let thrown: unknown | undefined = undefined
  try {
    await client.asyncFailureMethod()
  } catch (e) {
    thrown = e
  }

  expect(thrown).toBeInstanceOf(RuntimeError)
  expect((thrown as Error).message).toBe('oops: hello4')
})

test('decorating successfull sync methods should throw', () => {
  const client = new MyClient()
  expect(() => client.syncSuccessMethod()).toThrowError(InvalidAsyncFunctionArgumentError)
})

test('decorating failed sync methods should throw', () => {
  const client = new MyClient()
  expect(() => client.syncFailureMethod()).toThrowError(InvalidAsyncFunctionArgumentError)
})

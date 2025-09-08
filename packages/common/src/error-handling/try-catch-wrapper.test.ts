import { RuntimeError } from '@botpress/sdk'
import { createAsyncFnWrapperWithErrorRedaction, createErrorHandlingDecorator } from './try-catch-wrapper'
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

test("decorating successful async methods shouldn't change their behavior", async () => {
  // Arrange
  const client = new MyClient()

  // Act
  const promise = client.asyncSuccessMethod()

  // Assert
  await expect(promise).resolves.toBe('apple')
})

test('decorating failed async methods should redact the error', async () => {
  // Arrange
  const client = new MyClient()

  // Act
  const promise = client.asyncFailureMethod()

  // Assert
  await expect(promise).rejects.toThrow(RuntimeError)
  await expect(promise).rejects.toThrow('oops: hello4')
})

test("decorating successful sync methods shouldn't change their behaviour", () => {
  // Arrange
  const client = new MyClient()

  // Act
  const result = client.syncSuccessMethod()

  // Assert
  expect(result).toBe('banana')
})

test('decorating failed sync methods should redact the error', () => {
  // Arrange
  const client = new MyClient()

  // Act
  const call = () => client.syncFailureMethod()

  // Assert
  expect(call).toThrow(RuntimeError)
  expect(call).toThrow('oops: hello2')
})

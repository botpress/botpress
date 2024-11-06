import { createAsyncFnWrapperWithErrorRedaction } from '@botpress/common'
import * as sdk from '@botpress/sdk'

export const wrapAsyncFnWithTryCatch = createAsyncFnWrapperWithErrorRedaction((error: Error, customMessage: string) => {
  if (error instanceof sdk.RuntimeError) {
    return error
  }

  const googleError = _extractGoogleApiError(error)
  const redactedMessage = googleError ? `${customMessage}: ${googleError}` : customMessage

  console.warn(customMessage, error)
  return new sdk.RuntimeError(redactedMessage)
})

type AsyncMethod = (...args: unknown[]) => Promise<unknown>

export const handleErrorsDecorator =
  (errorMessage: string) =>
  (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor): void => {
    const _originalMethod: AsyncMethod = descriptor.value
    descriptor.value = function (...args: unknown[]) {
      return wrapAsyncFnWithTryCatch(_originalMethod.bind(this), errorMessage).apply(this, args)
    }
  }

const _extractGoogleApiError = (error: Error) =>
  'errors' in error && Array.isArray(error['errors'])
    ? error['errors']
        .map((err: { message: string }) => err.message)
        .join(', ')
        .replaceAll(/Invalid requests\[0\].[a-zA-Z]+:/g, '')
    : null

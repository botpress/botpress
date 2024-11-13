import { createAsyncFnWrapperWithErrorRedaction, createErrorHandlingDecorator } from '@botpress/common'
import * as sdk from '@botpress/sdk'
import { Common as GoogleApisCommon } from 'googleapis'

export const wrapAsyncFnWithTryCatch = createAsyncFnWrapperWithErrorRedaction((error: Error, customMessage: string) => {
  if (error instanceof sdk.RuntimeError) {
    return error
  }

  const googleError = _extractGoogleApiError(error)
  const redactedMessage = googleError ? `${customMessage}: ${googleError}` : customMessage

  console.warn(customMessage, error)
  return new sdk.RuntimeError(redactedMessage)
})

export const handleErrorsDecorator = createErrorHandlingDecorator(wrapAsyncFnWithTryCatch)

const _extractGoogleApiError = (error: Error) =>
  _isGaxiosError(error)
    ? error['errors']
        .map((err: { message: string }) => err.message)
        .join(', ')
        .replaceAll(/Invalid requests\[0\].[a-zA-Z]+:/g, '')
    : null

// For some reason, the Google API typing for GaxiosError does not correspond
// to the actual error object returned by the API. It is missing the `errors`
// field which contains the actual error messages. This type is a workaround
// to properly type the error object.
type AggregateGAxiosError = GoogleApisCommon.GaxiosError & { errors: Error[] }

const _isGaxiosError = (error: Error): error is AggregateGAxiosError =>
  'errors' in error && Array.isArray(error['errors'])

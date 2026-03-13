import { createAsyncFnWrapperWithErrorRedaction, createErrorHandlingDecorator } from '@botpress/common'
import * as sdk from '@botpress/sdk'
import axios from 'axios'

// Note: AirtableError from the `airtable` npm package does NOT extend Error.
// The createAsyncFnWrapperWithErrorRedaction wrapper converts it to
// new Error(airtableError.toString()), which produces a message like:
// "Some message(ERROR_CODE)[Http code 422]"
// This info is preserved in error.message and surfaced to the user below.

export const redactAirtableError = (error: Error, customErrorMessage: string): sdk.RuntimeError => {
  if (error instanceof sdk.RuntimeError) {
    return error
  }

  console.warn(customErrorMessage, error)

  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined
    const apiMessage = data?.error?.message ?? data?.message

    return new sdk.RuntimeError(
      `${customErrorMessage}${status ? ` [HTTP ${status}]` : ''}${apiMessage ? `: ${apiMessage}` : ''}`
    )
  }

  // For AirtableError (converted to Error via toString()) and other errors,
  // include the original message which contains useful API error details
  if (error.message && error.message !== customErrorMessage) {
    return new sdk.RuntimeError(`${customErrorMessage}: ${error.message}`)
  }

  return new sdk.RuntimeError(customErrorMessage)
}

export const wrapAsyncFnWithTryCatch = createAsyncFnWrapperWithErrorRedaction(redactAirtableError)
export const handleErrorsDecorator = createErrorHandlingDecorator(wrapAsyncFnWithTryCatch)

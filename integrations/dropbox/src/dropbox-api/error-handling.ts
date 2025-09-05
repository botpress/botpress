import { createAsyncFnWrapperWithErrorRedaction, createErrorHandlingDecorator } from '@botpress/common'
import * as sdk from '@botpress/sdk'
import { DropboxResponseError } from 'dropbox'

const COMMON_ERRORS: Readonly<Record<string, string>> = {
  'from_lookup/not_found/': 'The specified source file or folder was not found',
  'path/not_found/': 'The specified path was not found',
  'path_lookup/not_found/': 'The specified path was not found',
  'path/malformed/': 'The specified path is malformed',
  'path/': 'The target path is invalid',
  'payload_too_large/': 'The uploaded file is too large. The maximum file size is 150MB',
  'reset/': 'The cursor has been invalidated. You must perform a new search',
  'too_many_write_operations/': 'Too many write operations in progress',
  'too_many_requests/': 'You were rate-limited by Dropbox. Please try again later',
  'to/conflict/': 'The target path already exists',
} as const

const _errorRedactor = (error: Error, customMessage: string) => {
  if (error instanceof sdk.RuntimeError) {
    return error
  }

  console.warn(customMessage, error)

  return _tryToHandleDropboxError(error, customMessage) ?? new sdk.RuntimeError(customMessage)
}

const _tryToHandleDropboxError = (error: Error, customMessage: string) => {
  if (!(error instanceof DropboxResponseError && 'error_summary' in error.error)) {
    return
  }

  const errorMessage = Object.entries(COMMON_ERRORS).find(([errorKey]) =>
    error.error.error_summary.toString().startsWith(errorKey)
  )?.[1]

  return errorMessage ? new sdk.RuntimeError(`${customMessage}: ${errorMessage}`) : undefined
}

export const wrapAsyncFnWithTryCatch = createAsyncFnWrapperWithErrorRedaction(_errorRedactor)
export const handleErrorsDecorator = createErrorHandlingDecorator(wrapAsyncFnWithTryCatch)

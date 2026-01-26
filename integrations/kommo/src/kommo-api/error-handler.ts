import { ZodError, ZodIssue } from '@botpress/sdk'
import { isAxiosError } from 'axios'
import { KommoErrorResponse } from './types'

const formatZodErrors = (issues: ZodIssue[]) =>
  'Validation Error: ' +
  issues
    .map((issue) => {
      const path = issue.path?.length ? `${issue.path.join('.')}: ` : ''
      return path ? `${path}${issue.message}` : issue.message
    })
    .join('\n')

export const getErrorMessage = (err: unknown): string => {
  if (isAxiosError(err)) {
    // server dependent error
    const status = err.response?.status
    const data = err.response?.data
    // always present
    const message = err.message

    if (data && typeof data === 'object') {
      const kommoError = data as KommoErrorResponse

      if (kommoError.detail) {
        let errorMsg = kommoError.detail

        if (kommoError.validation_errors && kommoError.validation_errors.length > 0) {
          const validationDetails = kommoError.validation_errors
            .flatMap((ve) => ve.errors.map((e) => `${e.path}: ${e.detail}`))
            .join(', ')
          errorMsg += ` - ${validationDetails}`
        }

        return status ? `${errorMsg} (Status: ${status})` : errorMsg
      }
    }

    // Fallback for generic axios errors
    if (typeof data === 'string' && data.trim()) {
      return status ? `${data} (Status: ${status})` : data
    }
    return status ? `${message} (Status: ${status})` : message
  }

  if (err instanceof ZodError) {
    return formatZodErrors(err.errors)
  }

  if (err instanceof Error) {
    return err.message
  }

  if (typeof err === 'string') {
    return err
  }

  if (err && typeof err === 'object' && 'message' in err) {
    const message = (err as { message: unknown }).message
    if (typeof message === 'string') {
      return message
    }
  }
  return 'An unexpected error occurred'
}

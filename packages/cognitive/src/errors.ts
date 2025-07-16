import { type ErrorType } from '@botpress/client'

export type BotpressError = {
  isApiError: boolean
  code: number
  description: string
  type: ErrorType
  subtype?: string
  error?: unknown
  metadata?: unknown
  message?: string
  id: string
}

type Action = 'fallback' | 'retry' | 'abort'

export const getActionFromError = (error: any): Action => {
  if (!isBotpressError(error)) {
    return 'retry'
  }

  if (error.type === 'InvalidDataFormat') {
    if (error.message?.includes('data/model/id')) {
      // Invalid Model ID, so we want to try another model
      return 'fallback'
    }

    // Usually means the request was malformed
    return 'abort'
  }

  if (
    error.type === 'QuotaExceeded' ||
    error.type === 'RateLimited' ||
    error.type === 'Unknown' ||
    error.type === 'LimitExceeded'
  ) {
    // These errors are usually temporary, so we want to retry
    return 'retry'
  }

  const subtype = (error.metadata as any)?.subtype
  if (subtype === 'UPSTREAM_PROVIDER_FAILED') {
    // The model is degraded, so we want to try another model
    return 'fallback'
  }

  if (error.type === 'Internal') {
    // This is an internal error, probably a lambda timeout
    return 'retry'
  }

  return 'abort'
}

export const isNotFoundError = (error: any): boolean => isBotpressError(error) && error.type === 'ResourceNotFound'

export const isForbiddenOrUnauthorizedError = (error: any): boolean =>
  isBotpressError(error) && (error.type === 'Forbidden' || error.type === 'Unauthorized')

export const isBotpressError = (error: any): error is BotpressError =>
  typeof error === 'object' &&
  error !== null &&
  'isApiError' in error &&
  'code' in error &&
  'type' in error &&
  'id' in error

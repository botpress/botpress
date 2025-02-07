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

  const subtype = (error.metadata as any)?.subtype
  if (error.type === 'Internal' || subtype === 'UPSTREAM_PROVIDER_FAILED') {
    // The model is degraded, so we want to try another model
    return 'fallback'
  }

  return 'abort'
}

export const isBotpressError = (error: any): error is BotpressError =>
  typeof error === 'object' &&
  error !== null &&
  'isApiError' in error &&
  'code' in error &&
  'type' in error &&
  'id' in error

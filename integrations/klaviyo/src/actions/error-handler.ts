import { RuntimeError } from '@botpress/sdk'
import type { KlaviyoApiError, KlaviyoError } from './types'

type ErrorArrayShape = { errors?: KlaviyoError[] }
type ResponseDataShape = { data?: ErrorArrayShape }
type AxiosLikeWithKlaviyo = { response?: ResponseDataShape }

// Check if we can treat the error as a Klaviyo API error
export function isKlaviyoErrorResponse(e: object): e is { response: { data: KlaviyoApiError } } {
  const maybeKlaviyoErrorResponse = e as AxiosLikeWithKlaviyo
  return Array.isArray(maybeKlaviyoErrorResponse.response?.data?.errors)
}

// Extract the message from the Klaviyo API error
export function extractKlaviyoMessage(errors: KlaviyoError[]): string {
  return errors
    .map((error) => error.detail || error.title)
    .filter((s): s is string => Boolean(s && s.trim()))
    .join(', ')
}

export function handleKlaviyoError(
  error: unknown,
  defaultMessage: string,
  logger?: { forBot(): { error(message: string, error?: unknown): void } },
  logMessage?: string
): never {
  // Log the error if logger is provided
  if (logger && logMessage) {
    logger.forBot().error(logMessage, error)
  }

  // Check if it's a Klaviyo API error
  if (typeof error === 'object' && error && isKlaviyoErrorResponse(error)) {
    const msg = extractKlaviyoMessage(error.response.data.errors)
    throw new RuntimeError(`Klaviyo API error: ${msg}`)
  }

  // Throw default error for non-Klaviyo errors
  throw new RuntimeError(defaultMessage)
}

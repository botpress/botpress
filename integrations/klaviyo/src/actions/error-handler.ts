import { RuntimeError } from '@botpress/sdk'
import type { KlaviyoApiError, KlaviyoError } from './types'

type ErrorArrayShape = { errors?: KlaviyoError[] }
type ResponseDataShape = { data?: ErrorArrayShape }
type AxiosLikeWithKlaviyo = { response?: ResponseDataShape }

export function isKlaviyoErrorResponse(e: object): e is { response: { data: KlaviyoApiError } } {
  const maybe = e as AxiosLikeWithKlaviyo
  return Array.isArray(maybe.response?.data?.errors)
}

export function extractKlaviyoMessage(errors: KlaviyoError[]): string {
  return errors
    .map((er) => er.detail || er.title)
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

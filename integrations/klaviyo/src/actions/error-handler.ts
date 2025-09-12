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

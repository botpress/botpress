import { createAsyncFnWrapperWithErrorRedaction, defaultErrorRedactor } from '@botpress/common'
import { z } from '@botpress/sdk'
import { Common } from 'googleapis'
import * as bp from '.botpress'

export const wrapWithTryCatch = createAsyncFnWrapperWithErrorRedaction(defaultErrorRedactor)

const errorDetailSchema = z.object({
  domain: z.string(),
  reason: z.string(),
  message: z.string(),
})
type ErrorDetail = z.infer<typeof errorDetailSchema>
// For some reason, the Google API typing for GaxiosError does not correspond
// to the actual error object returned by the API. It is missing the `errors`
// field which contains the actual error messages. This type is a workaround
// to properly type the error object.
export type AggregateGAxiosError = Common.GaxiosError & { errors: ErrorDetail[] }
export const isGaxiosError = (error: unknown): error is AggregateGAxiosError => {
  return (
    error instanceof Error &&
    'errors' in error &&
    Array.isArray(error['errors']) &&
    error['errors'].every((err) => errorDetailSchema.safeParse(err).success)
  )
}

export type SubscriptionRateLimitError = AggregateGAxiosError // No discriminant
const SUBSCRIPTION_RATE_LIMIT_ERR_REASON = 'subscriptionRateLimitExceeded'
export const isSubscriptionRateLimitError = (error: unknown): error is SubscriptionRateLimitError => {
  if (!isGaxiosError(error)) {
    return false
  }
  return error.status === 403 && error.errors.some((err) => err.reason === SUBSCRIPTION_RATE_LIMIT_ERR_REASON)
}

export type NotFoundError = AggregateGAxiosError // No discriminant
export const isNotFoundError = (error: unknown): error is NotFoundError => {
  if (!isGaxiosError(error)) {
    return false
  }
  return error.status === 404
}

export const handleRateLimitError = async (e: unknown, logger?: bp.Logger): Promise<undefined> => {
  if (!isSubscriptionRateLimitError(e)) {
    throw e
  }
  if (logger) {
    logger.forBot().warn('Subscription rate limit exceeded. Retry operation later.')
  }
  return undefined
}

export const handleNotFoundError = async (e: unknown, logger?: bp.Logger): Promise<undefined> => {
  if (!isNotFoundError(e)) {
    throw e
  }
  if (logger) {
    logger.forBot().error(e.errors.map((err) => err.message).join('\n'))
  }
  return undefined
}

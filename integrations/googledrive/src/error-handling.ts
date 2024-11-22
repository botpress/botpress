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
export const isGaxiosError = (error: Error): error is AggregateGAxiosError => {
  return (
    'errors' in error &&
    Array.isArray(error['errors']) &&
    error['errors'].every((err) => errorDetailSchema.safeParse(err).success)
  )
}

export type SubscriptionRateLimitError = AggregateGAxiosError // No discriminant
const SUBSCRIPTION_RATE_LIMIT_ERR_REASON = 'subscriptionRateLimitExceeded'
export const isSubscriptionRateLimitError = (error: Error): error is SubscriptionRateLimitError => {
  if (!isGaxiosError(error)) {
    return false
  }
  return error.status === 403 && error.errors.some((err) => err.reason === SUBSCRIPTION_RATE_LIMIT_ERR_REASON)
}

export type NotFoundError = AggregateGAxiosError // No discriminant
export const isNotFoundError = (error: Error): error is NotFoundError => {
  if (!isGaxiosError(error)) {
    return false
  }
  return error.status === 404
}

export const wrapWithTryCatchCallback = async <T, WrappedFn extends () => Promise<T>>(
  fn: WrappedFn,
  onCatch: (error: any) => Promise<void>
): Promise<T | undefined> => {
  let result: Awaited<T> | undefined
  try {
    result = await fn()
  } catch (e: any) {
    await onCatch(e)
    result = undefined
  }
  return result
}

export const wrapWithTryCatchRateLimit = <T>(fn: () => Promise<T>, logger?: bp.Logger): Promise<T | undefined> => {
  return wrapWithTryCatchCallback(fn, async (e) => {
    if (!isSubscriptionRateLimitError(e)) {
      throw e
    }
    if (logger) {
      logger.forBot().warn('Subscription rate limit exceeded. Retry operation later.')
    }
  })
}

export const wrapWithTryCatchNotFound = <T>(fn: () => Promise<T>, logger?: bp.Logger): Promise<T | undefined> => {
  return wrapWithTryCatchCallback(fn, async (e) => {
    if (!isNotFoundError(e)) {
      throw e
    }
    if (logger) {
      logger.forBot().error(e.errors.map((err) => err.message).join('\n'))
    }
  })
}

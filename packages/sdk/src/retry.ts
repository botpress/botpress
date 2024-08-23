import { RetryConfig, axiosRetry } from '@botpress/client'

export const retryConfig: RetryConfig = {
  retries: 3,
  retryCondition: (err) =>
    axiosRetry.isNetworkOrIdempotentRequestError(err) || [429, 502].includes(err.response?.status ?? 0),
  retryDelay: (retryCount) => retryCount * 1000,
}

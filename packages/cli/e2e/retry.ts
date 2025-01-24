import * as client from '@botpress/client'

export const config: client.RetryConfig = {
  retries: 3,
  retryCondition: (err) =>
    client.axiosRetry.isNetworkOrIdempotentRequestError(err) || [429, 502].includes(err.response?.status ?? 0),
  retryDelay: (retryCount) => retryCount * 1000,
}

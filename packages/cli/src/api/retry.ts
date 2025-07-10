import * as client from '@botpress/client'

const HTTP_STATUS_TO_RETRY_ON = [429, 500, 502, 503, 504]
export const config: client.RetryConfig = {
  retries: 3,
  retryCondition: (err) =>
    client.axiosRetry.isNetworkOrIdempotentRequestError(err) ||
    HTTP_STATUS_TO_RETRY_ON.includes(err.response?.status ?? 0),
  retryDelay: (retryCount) => retryCount * 1000,
}

import * as client from '@botpress/client'

// TODO: we probably shouldnt retry on 500 errors, but this is a temporary fix for the botpress repo CI
const HTTP_STATUS_TO_RETRY_ON = [429, 500, 502, 503, 504]
export const config: client.RetryConfig = {
  retries: 3,
  retryCondition: (err) =>
    client.axiosRetry.isNetworkOrIdempotentRequestError(err) ||
    HTTP_STATUS_TO_RETRY_ON.includes(err.response?.status ?? 0),
  retryDelay: (retryCount) => retryCount * 1000,
}

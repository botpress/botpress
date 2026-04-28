import * as client from '@botpress/client'

// TODO: we probably shouldnt retry on 500 errors, but this is a temporary fix for the botpress repo CI
const HTTP_STATUS_TO_RETRY_ON = [429, 500, 502, 503, 504]

function getRetryAfterMs(error: Parameters<NonNullable<client.RetryConfig['retryDelay']>>[1]): number | undefined {
  const headers = error?.response?.headers
  if (!headers) return undefined

  const headerNames = ['retry-after', 'ratelimit-reset', 'x-ratelimit-reset']
  for (const name of headerNames) {
    const raw = headers[name]
    if (!raw) continue
    const value = String(raw)

    // HTTP-date format (e.g. "Mon, 28 Apr 2026 12:00:00 GMT")
    if (value.includes(' ')) {
      const futureDate = new Date(value)
      if (!isNaN(futureDate.getTime())) {
        return Math.max(0, futureDate.getTime() - Date.now())
      }
      continue
    }

    // Seconds format (e.g. "120")
    const seconds = parseInt(value, 10)
    if (!isNaN(seconds) && seconds >= 0) {
      return seconds * 1000
    }
  }
  return undefined
}

export const config: client.RetryConfig = {
  retries: 3,
  retryCondition: (err) =>
    client.axiosRetry.isNetworkOrIdempotentRequestError(err) ||
    HTTP_STATUS_TO_RETRY_ON.includes(err.response?.status ?? 0),
  retryDelay: (retryCount, error) => {
    if (error?.response?.status === 429) {
      const retryAfterMs = getRetryAfterMs(error)
      if (retryAfterMs !== undefined) {
        return retryAfterMs
      }
    }
    return Math.max(retryCount, 1) * 1000
  },
}

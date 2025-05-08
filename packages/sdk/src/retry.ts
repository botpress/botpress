import * as client from '@botpress/client'

export const retryConfig: client.RetryConfig = {
  retries: 3,
  retryCondition: (err) =>
    client.axiosRetry.isNetworkOrIdempotentRequestError(err) || [429, 502].includes(err.response?.status ?? 0),
  retryDelay: (retryCount, axiosError) => {
    const retryAfterSeconds = _getRetryAfterSeconds(axiosError.response?.headers ?? {})
    return (retryAfterSeconds ?? retryCount) * 1000
  },
}

const _getRetryAfterSeconds = (headers: client.axios.RawAxiosResponseHeaders) => {
  const headerNames = [
    // Standard rate limiting headers:
    'RateLimit-Reset',
    'X-RateLimit-Reset',
    'Retry-After',

    // Lowercase variants:
    'ratelimit-reset',
    'x-ratelimit-reset',
    'retry-after',
  ] as const

  for (const headerName of headerNames) {
    const headerValue: unknown = headers[headerName]

    if (headerValue === undefined) {
      continue
    }

    const headerValueString = String(headerValue)

    try {
      // NOTE: retry-after can be either a number of seconds or a date string:
      if (_isDateString(headerValueString)) {
        const futureDate = new Date(headerValueString)

        if (isNaN(futureDate.getTime())) {
          continue
        }

        const currentDate = new Date()
        const secondsDiff = Math.max(0, Math.floor((futureDate.getTime() - currentDate.getTime()) / 1000))

        return secondsDiff
      }

      // If it's a number, we assume it's in seconds:
      else if (headerValueString.length > 0) {
        return parseInt(headerValueString, 10)
      }
    } catch {
      continue
    }
  }
  return
}

const _isDateString = (value: string): boolean => value.includes(' ')

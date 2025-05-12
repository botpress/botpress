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

    return _parseHeaderToSeconds(String(headerValue))
  }

  return
}

const _parseHeaderToSeconds = (headerValue: string): number | undefined => {
  // NOTE: retry-after can be either a number of seconds or a date string:
  const secondsDiff = _isDateString(headerValue)
    ? _parseDateToSeconds(headerValue)
    : headerValue.length > 0
      ? parseInt(headerValue, 10)
      : undefined

  return secondsDiff === undefined || isNaN(secondsDiff) ? undefined : secondsDiff
}

const _isDateString = (headerValue: string): boolean => headerValue.includes(' ')

const _parseDateToSeconds = (headerValue: string): number | undefined => {
  const futureDate = _parseDateString(headerValue)
  if (!futureDate) {
    return
  }

  const currentDate = new Date()
  return Math.max(0, Math.floor((futureDate.getTime() - currentDate.getTime()) / 1000))
}

const _parseDateString = (headerValue: string): Date | undefined => {
  const date = new Date(headerValue)
  return isNaN(date.getTime()) ? undefined : date
}

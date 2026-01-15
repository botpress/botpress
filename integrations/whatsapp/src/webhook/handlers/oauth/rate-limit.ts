import axios from 'axios'

// Meta API rate limit error codes
// See: https://developers.facebook.com/docs/graph-api/overview/rate-limiting
const RATE_LIMIT_ERROR_CODES = new Set([
  4, // Application request limit reached
  17, // User request limit reached
  32, // Page request limit reached
  613, // Calls to this API have exceeded the rate limit
])

export const RATE_LIMITED_ERROR =
  'Your Meta account is currently rate-limited. Please wait a few minutes before trying again.'

export const isRateLimitError = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) {
    return false
  }
  const errorCode = error.response?.data?.error?.code
  return typeof errorCode === 'number' && RATE_LIMIT_ERROR_CODES.has(errorCode)
}

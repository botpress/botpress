import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, test } from 'vitest'
import { isRateLimitError } from './rate-limit'

const _createMetaApiError = (errorCode: number): AxiosError => {
  const error = new AxiosError('Request failed')
  error.response = {
    data: { error: { code: errorCode } },
    status: 400,
    statusText: 'Bad Request',
    headers: {},
    config: { headers: new AxiosHeaders() },
  }
  return error
}

describe('isRateLimitError', () => {
  test('detects Meta rate-limit error code', () => {
    expect(isRateLimitError(_createMetaApiError(4))).toBe(true)
  })

  test('rejects other Meta API error codes', () => {
    expect(isRateLimitError(_createMetaApiError(100))).toBe(false)
  })

  test('rejects non-Axios errors', () => {
    expect(isRateLimitError(new Error('Connection failed'))).toBe(false)
  })

  test('rejects Axios errors without response data', () => {
    const networkError = new AxiosError('Network Error')
    networkError.code = 'ECONNREFUSED'
    expect(isRateLimitError(networkError)).toBe(false)
  })
})

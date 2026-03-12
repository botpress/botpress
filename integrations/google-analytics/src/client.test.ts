import { AxiosError, AxiosHeaders } from 'axios'
import { describe, test, expect } from 'vitest'
import { parseJsonObject, parseError } from './client'

describe('parseJsonObject', () => {
  test('returns empty object when value is undefined', () => {
    expect(parseJsonObject(undefined, 'field')).toEqual({})
  })

  test('returns empty object when value is empty string', () => {
    expect(parseJsonObject('', 'field')).toEqual({})
  })

  test('parses a valid JSON object', () => {
    expect(parseJsonObject('{"key":"value","num":42}', 'field')).toEqual({ key: 'value', num: 42 })
  })

  test('parses a nested JSON object', () => {
    const input = '{"user":{"name":"Alice","tags":["a","b"]}}'
    expect(parseJsonObject(input, 'field')).toEqual({ user: { name: 'Alice', tags: ['a', 'b'] } })
  })

  test('throws on invalid JSON syntax', () => {
    expect(() => parseJsonObject('{invalid', 'myField')).toThrow()
  })

  test('throws when JSON is an array', () => {
    expect(() => parseJsonObject('[1,2,3]', 'myField')).toThrow('myField must be a valid JSON object')
  })

  test('throws when JSON is a string', () => {
    expect(() => parseJsonObject('"hello"', 'myField')).toThrow('myField must be a valid JSON object')
  })

  test('throws when JSON is a number', () => {
    expect(() => parseJsonObject('42', 'myField')).toThrow('myField must be a valid JSON object')
  })

  test('throws when JSON is null', () => {
    expect(() => parseJsonObject('null', 'myField')).toThrow('myField must be a valid JSON object')
  })

  test('throws when JSON is a boolean', () => {
    expect(() => parseJsonObject('true', 'myField')).toThrow('myField must be a valid JSON object')
  })
})

describe('parseError', () => {
  test('returns message from a standard Error', () => {
    expect(parseError(new Error('something broke'))).toBe('something broke')
  })

  test('returns string error as-is', () => {
    expect(parseError('raw string error')).toBe('raw string error')
  })

  test('returns number error as string', () => {
    expect(parseError(404)).toBe('404')
  })

  test('returns boolean error as string', () => {
    expect(parseError(false)).toBe('false')
  })

  test('returns fallback for undefined', () => {
    expect(parseError(undefined)).toBe('An unexpected error occurred')
  })

  test('returns fallback for null', () => {
    expect(parseError(null)).toBe('An unexpected error occurred')
  })

  test('extracts message from object with message property', () => {
    expect(parseError({ message: 'custom error' })).toBe('custom error')
  })

  test('handles AxiosError with response data string', () => {
    const error = new AxiosError('Request failed', '400', undefined, {}, {
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: 'Bad request body',
    })

    expect(parseError(error)).toBe('Request failed with status 400: Bad request body')
  })

  test('handles AxiosError with response data object', () => {
    const error = new AxiosError('Request failed', '422', undefined, {}, {
      status: 422,
      statusText: 'Unprocessable Entity',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: { error: 'validation_error', details: 'invalid field' },
    })

    expect(parseError(error)).toBe(
      'Request failed with status 422: {"error":"validation_error","details":"invalid field"}'
    )
  })

  test('handles AxiosError with no response (network error)', () => {
    const error = new AxiosError('Network Error', 'ERR_NETWORK', undefined, {})

    expect(parseError(error)).toBe('No response received: Network Error')
  })

  test('handles AxiosError with no request and no response', () => {
    const error = new AxiosError('Config error')

    expect(parseError(error)).toBe('Axios error: Config error')
  })
})

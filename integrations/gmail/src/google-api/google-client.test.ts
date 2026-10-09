import { describe, expect, it } from 'vitest'
import { isInvalidGrantError } from './google-client'

describe('isInvalidGrantError', () => {
  it('detects invalid_grant in the token endpoint response', () => {
    const error = Object.assign(new Error('invalid_grant'), {
      response: { status: 400, data: { error: 'invalid_grant', error_description: 'Bad Request' } },
    })
    expect(isInvalidGrantError(error)).toBe(true)
  })

  it('detects invalid_grant from the error message alone', () => {
    expect(isInvalidGrantError(new Error('invalid_grant'))).toBe(true)
  })

  it.each([
    ['a network error', new Error('socket hang up')],
    [
      'a server error',
      Object.assign(new Error('Internal Server Error'), { response: { status: 500, data: { error: 'internal' } } }),
    ],
    ['a non-object', 'invalid_grant'],
    ['null', null],
  ])('ignores %s', (_label, thrown) => {
    expect(isInvalidGrantError(thrown)).toBe(false)
  })
})

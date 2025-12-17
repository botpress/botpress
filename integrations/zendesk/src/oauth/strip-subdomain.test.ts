import { test, expect, describe } from 'vitest'
import { stripSubdomain } from './utils'

describe('stripSubdomain', () => {
  test('full url with -', () => {
    expect(stripSubdomain('https://botpress-test-test.zendesk.com')).toBe('botpress-test-test')
  })
  test('subdomain with -', () => {
    expect(stripSubdomain('botpress-test-test')).toBe('botpress-test-test')
  })

  test('full url with .', () => {
    expect(stripSubdomain('https://botpress........zendesk.com')).toBe('botpress.......')
  })
  test('subdomain with .', () => {
    expect(stripSubdomain('botpress.......')).toBe('botpress.......')
  })

  test('full url with symbols', () => {
    expect(stripSubdomain('https://!@#$%^&*()_+~.zendesk.com')).toBe('!@#$%^&*()_+~')
  })
  test('subdomain with symbols', () => {
    expect(stripSubdomain('!@#$%^&*()_+~')).toBe('!@#$%^&*()_+~')
  })

  test('full url with all', () => {
    expect(stripSubdomain('https://abc.123-!@#.zendesk.com')).toBe('abc.123-!@#')
  })
  test('subdomain with all', () => {
    expect(stripSubdomain('abc.123-!@#')).toBe('abc.123-!@#')
  })
})

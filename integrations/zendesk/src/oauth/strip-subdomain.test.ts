import { test, expect, describe } from 'vitest'
import { stripSubdomain } from './utils'

describe('stripSubdomain', () => {
  test('full url https with -', () => {
    expect(stripSubdomain('https://botpress-test-test.zendesk.com')).toBe('botpress-test-test')
  })
  test('full url http with -', () => {
    expect(stripSubdomain('http://botpress-test-test.zendesk.com')).toBe('botpress-test-test')
  })
  test('subdomain with - with .zendesk.com', () => {
    expect(stripSubdomain('botpress-test-test.zendesk.com')).toBe('botpress-test-test')
  })
  test('subdomain with -', () => {
    expect(stripSubdomain('botpress-test-test')).toBe('botpress-test-test')
  })

  test('full url https with - (leading spaces)', () => {
    expect(stripSubdomain('  https://botpress-test-test.zendesk.com')).toBe('botpress-test-test')
  })
  test('full url https with - (trailing spaces)', () => {
    expect(stripSubdomain('https://botpress-test-test.zendesk.com  ')).toBe('botpress-test-test')
  })
  test('full url https with - (leading and trailing spaces)', () => {
    expect(stripSubdomain('  https://botpress-test-test.zendesk.com  ')).toBe('botpress-test-test')
  })
  test('full url http with - (leading spaces)', () => {
    expect(stripSubdomain('  http://botpress-test-test.zendesk.com')).toBe('botpress-test-test')
  })
  test('full url http with - (trailing spaces)', () => {
    expect(stripSubdomain('http://botpress-test-test.zendesk.com  ')).toBe('botpress-test-test')
  })
  test('full url http with - (leading and trailing spaces)', () => {
    expect(stripSubdomain('  http://botpress-test-test.zendesk.com  ')).toBe('botpress-test-test')
  })
  test('subdomain with - with .zendesk.com (leading spaces)', () => {
    expect(stripSubdomain('  botpress-test-test.zendesk.com')).toBe('botpress-test-test')
  })
  test('subdomain with - with .zendesk.com (trailing spaces)', () => {
    expect(stripSubdomain('botpress-test-test.zendesk.com  ')).toBe('botpress-test-test')
  })
  test('subdomain with - with .zendesk.com (leading and trailing spaces)', () => {
    expect(stripSubdomain('  botpress-test-test.zendesk.com  ')).toBe('botpress-test-test')
  })
  test('subdomain with - (leading spaces)', () => {
    expect(stripSubdomain('  botpress-test-test')).toBe('botpress-test-test')
  })
  test('subdomain with - (trailing spaces)', () => {
    expect(stripSubdomain('botpress-test-test  ')).toBe('botpress-test-test')
  })
  test('subdomain with - (leading and trailing spaces)', () => {
    expect(stripSubdomain('  botpress-test-test  ')).toBe('botpress-test-test')
  })

  test('full url https with .', () => {
    expect(stripSubdomain('https://botpress........zendesk.com')).toBe('botpress.......')
  })
  test('full url http with .', () => {
    expect(stripSubdomain('http://botpress........zendesk.com')).toBe('botpress.......')
  })
  test('subdomain with . with .zendesk.com', () => {
    expect(stripSubdomain('botpress........zendesk.com')).toBe('botpress.......')
  })
  test('subdomain with .', () => {
    expect(stripSubdomain('botpress.......')).toBe('botpress.......')
  })

  test('full url https with . (leading spaces)', () => {
    expect(stripSubdomain('  https://botpress........zendesk.com')).toBe('botpress.......')
  })
  test('full url https with . (trailing spaces)', () => {
    expect(stripSubdomain('https://botpress........zendesk.com  ')).toBe('botpress.......')
  })
  test('full url https with . (leading and trailing spaces)', () => {
    expect(stripSubdomain('  https://botpress........zendesk.com  ')).toBe('botpress.......')
  })
  test('full url http with . (leading spaces)', () => {
    expect(stripSubdomain('  http://botpress........zendesk.com')).toBe('botpress.......')
  })
  test('full url http with . (trailing spaces)', () => {
    expect(stripSubdomain('http://botpress........zendesk.com  ')).toBe('botpress.......')
  })
  test('full url http with . (leading and trailing spaces)', () => {
    expect(stripSubdomain('  http://botpress........zendesk.com  ')).toBe('botpress.......')
  })
  test('subdomain with . with .zendesk.com (leading spaces)', () => {
    expect(stripSubdomain('  botpress........zendesk.com')).toBe('botpress.......')
  })
  test('subdomain with . with .zendesk.com (trailing spaces)', () => {
    expect(stripSubdomain('botpress........zendesk.com  ')).toBe('botpress.......')
  })
  test('subdomain with . with .zendesk.com (leading and trailing spaces)', () => {
    expect(stripSubdomain('  botpress........zendesk.com  ')).toBe('botpress.......')
  })
  test('subdomain with . (leading spaces)', () => {
    expect(stripSubdomain('  botpress.......')).toBe('botpress.......')
  })
  test('subdomain with . (trailing spaces)', () => {
    expect(stripSubdomain('botpress.......  ')).toBe('botpress.......')
  })
  test('subdomain with . (leading and trailing spaces)', () => {
    expect(stripSubdomain('  botpress.......  ')).toBe('botpress.......')
  })

  test('full url https with symbols', () => {
    expect(stripSubdomain('https://!@#$%^&*()_+~.zendesk.com')).toBe('!@#$%^&*()_+~')
  })
  test('full url http with symbols', () => {
    expect(stripSubdomain('http://!@#$%^&*()_+~.zendesk.com')).toBe('!@#$%^&*()_+~')
  })
  test('subdomain with symbols with .zendesk.com', () => {
    expect(stripSubdomain('!@#$%^&*()_+~.zendesk.com')).toBe('!@#$%^&*()_+~')
  })
  test('subdomain with symbols', () => {
    expect(stripSubdomain('!@#$%^&*()_+~')).toBe('!@#$%^&*()_+~')
  })

  test('full url https with symbols (leading spaces)', () => {
    expect(stripSubdomain('  https://!@#$%^&*()_+~.zendesk.com')).toBe('!@#$%^&*()_+~')
  })
  test('full url https with symbols (trailing spaces)', () => {
    expect(stripSubdomain('https://!@#$%^&*()_+~.zendesk.com  ')).toBe('!@#$%^&*()_+~')
  })
  test('full url https with symbols (leading and trailing spaces)', () => {
    expect(stripSubdomain('  https://!@#$%^&*()_+~.zendesk.com  ')).toBe('!@#$%^&*()_+~')
  })
  test('full url http with symbols (leading spaces)', () => {
    expect(stripSubdomain('  http://!@#$%^&*()_+~.zendesk.com')).toBe('!@#$%^&*()_+~')
  })
  test('full url http with symbols (trailing spaces)', () => {
    expect(stripSubdomain('http://!@#$%^&*()_+~.zendesk.com  ')).toBe('!@#$%^&*()_+~')
  })
  test('full url http with symbols (leading and trailing spaces)', () => {
    expect(stripSubdomain('  http://!@#$%^&*()_+~.zendesk.com  ')).toBe('!@#$%^&*()_+~')
  })
  test('subdomain with symbols with .zendesk.com (leading spaces)', () => {
    expect(stripSubdomain('  !@#$%^&*()_+~.zendesk.com')).toBe('!@#$%^&*()_+~')
  })
  test('subdomain with symbols with .zendesk.com (trailing spaces)', () => {
    expect(stripSubdomain('!@#$%^&*()_+~.zendesk.com  ')).toBe('!@#$%^&*()_+~')
  })
  test('subdomain with symbols with .zendesk.com (leading and trailing spaces)', () => {
    expect(stripSubdomain('  !@#$%^&*()_+~.zendesk.com  ')).toBe('!@#$%^&*()_+~')
  })
  test('subdomain with symbols (leading spaces)', () => {
    expect(stripSubdomain('  !@#$%^&*()_+~')).toBe('!@#$%^&*()_+~')
  })
  test('subdomain with symbols (trailing spaces)', () => {
    expect(stripSubdomain('!@#$%^&*()_+~  ')).toBe('!@#$%^&*()_+~')
  })
  test('subdomain with symbols (leading and trailing spaces)', () => {
    expect(stripSubdomain('  !@#$%^&*()_+~  ')).toBe('!@#$%^&*()_+~')
  })

  test('full url https with all', () => {
    expect(stripSubdomain('https://abc.123-!@#.zendesk.com')).toBe('abc.123-!@#')
  })
  test('full url http with all', () => {
    expect(stripSubdomain('http://abc.123-!@#.zendesk.com')).toBe('abc.123-!@#')
  })
  test('subdomain with all with .zendesk.com', () => {
    expect(stripSubdomain('abc.123-!@#.zendesk.com')).toBe('abc.123-!@#')
  })
  test('subdomain with all', () => {
    expect(stripSubdomain('abc.123-!@#')).toBe('abc.123-!@#')
  })

  test('full url https with all (leading spaces)', () => {
    expect(stripSubdomain('  https://abc.123-!@#.zendesk.com')).toBe('abc.123-!@#')
  })
  test('full url https with all (trailing spaces)', () => {
    expect(stripSubdomain('https://abc.123-!@#.zendesk.com  ')).toBe('abc.123-!@#')
  })
  test('full url https with all (leading and trailing spaces)', () => {
    expect(stripSubdomain('  https://abc.123-!@#.zendesk.com  ')).toBe('abc.123-!@#')
  })
  test('full url http with all (leading spaces)', () => {
    expect(stripSubdomain('  http://abc.123-!@#.zendesk.com')).toBe('abc.123-!@#')
  })
  test('full url http with all (trailing spaces)', () => {
    expect(stripSubdomain('http://abc.123-!@#.zendesk.com  ')).toBe('abc.123-!@#')
  })
  test('full url http with all (leading and trailing spaces)', () => {
    expect(stripSubdomain('  http://abc.123-!@#.zendesk.com  ')).toBe('abc.123-!@#')
  })
  test('subdomain with all with .zendesk.com (leading spaces)', () => {
    expect(stripSubdomain('  abc.123-!@#.zendesk.com')).toBe('abc.123-!@#')
  })
  test('subdomain with all with .zendesk.com (trailing spaces)', () => {
    expect(stripSubdomain('abc.123-!@#.zendesk.com  ')).toBe('abc.123-!@#')
  })
  test('subdomain with all with .zendesk.com (leading and trailing spaces)', () => {
    expect(stripSubdomain('  abc.123-!@#.zendesk.com  ')).toBe('abc.123-!@#')
  })
  test('subdomain with all (leading spaces)', () => {
    expect(stripSubdomain('  abc.123-!@#')).toBe('abc.123-!@#')
  })
  test('subdomain with all (trailing spaces)', () => {
    expect(stripSubdomain('abc.123-!@#  ')).toBe('abc.123-!@#')
  })
  test('subdomain with all (leading and trailing spaces)', () => {
    expect(stripSubdomain('  abc.123-!@#  ')).toBe('abc.123-!@#')
  })
})

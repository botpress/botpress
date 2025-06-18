import { it, expect } from 'vitest'
import { isValidGlob, matchGlob } from './globs'

it('isValidGlob', () => {
  expect(isValidGlob('*')).toBe(true)
  expect(isValidGlob('/admin/')).toBe(true)
  expect(isValidGlob('*/admin')).toBe(true)
  expect(isValidGlob('https://botpress.com/*')).toBe(true)
  expect(isValidGlob('https://botpress.com/*/blog')).toBe(true)

  expect(isValidGlob('https://botpress.com/**/blog')).toBe(false)
  expect(isValidGlob('**')).toBe(false)
  expect(isValidGlob('**')).toBe(false)
  expect(isValidGlob('')).toBe(false)
  expect(isValidGlob('          ')).toBe(false)

  expect(isValidGlob('https://*.botpress.com/*/blog')).toBe(false)
})

it('matchGlob', () => {
  expect(matchGlob('https://example.com', '*')).toBe(true)
  expect(matchGlob('https://example.com/path', '*')).toBe(true)
  expect(matchGlob('http://sub.example.com', '*')).toBe(true)

  expect(matchGlob('https://example.com/admin/dashboard', '/admin/')).toBe(true)
  expect(matchGlob('https://example.com/admin/dashboard', 'admin')).toBe(true)
  expect(matchGlob('https://example.com/admin/dashboard', '*/dashboard')).toBe(true)
  expect(matchGlob('https://example.com/admin/dashboard', 'https://example.com/admin/dashboard')).toBe(true)
  expect(matchGlob('https://example.com/admin/dashboard', 'https://example.com/admin/dashboard*')).toBe(true)

  expect(matchGlob('https://example.com/admin/dashboard', 'https://example.com/*/dashboard')).toBe(true)
  expect(matchGlob('https://example.com/admin/dashboard', 'https://example.com/*')).toBe(true)
  expect(matchGlob('https://example.com/admin/dashboard', 'https://example.com')).toBe(true)
  expect(matchGlob('https://example.com/admin/dashboard', '*example.com/admin/dashboard')).toBe(true)

  expect(matchGlob('https://example.com/admin/dashboard', 'world')).toBe(false)
  expect(matchGlob('https://example.com/admin/dashboard', 'http://example.com/*')).toBe(false)
  expect(matchGlob('https://example.com/admin/dashboard', 'https://example.com/*/dashboard/hello')).toBe(false)
})

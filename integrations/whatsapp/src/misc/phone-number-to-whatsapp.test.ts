import { test, expect } from 'vitest'
import { formatPhoneNumber } from './phone-number-to-whatsapp'

test('throws on invalid phone number', () => {
  expect(() => formatPhoneNumber('garbage', 'US')).toThrow('Invalid phone number')
})

test('Argentina: removes "15" prefix, trims leading zeros, and inserts +549', () => {
  expect(formatPhoneNumber('(11) 15 2345-6789', 'AR')).toBe('+5491123456789')
})

test('Argentina: also strips national leading zeros even without "15"', () => {
  expect(formatPhoneNumber('(011) 2345 6789', 'AR')).toBe('+5491123456789')
})

test('Mexico: ensures +521 prefix and strips leading zeros', () => {
  expect(formatPhoneNumber('55 1234 5678', 'MX')).toBe('+5215512345678')
})

test('Generic leading-zero cleanup for countries other than AR/MX', () => {
  expect(formatPhoneNumber('(0151 12) 34 567', 'GB')).toBe('+441511234567')
})

test('Leaves already-clean e164 untouched (non-AR/MX)', () => {
  expect(formatPhoneNumber('(415) 555-2671', 'US')).toBe('+14155552671')
})

test('Simple case: adds leading + for e164 format', () => {
  expect(formatPhoneNumber('416-555-0123', 'CA')).toBe('+14165550123')
})

test('Insure this phone number typing works +1 (xxx) xxx-xxxx', () => {
  expect(formatPhoneNumber('+1 (581) 849-1511')).toBe('+15818491511')
})

test('Insure this phone number typing works +1 xxx xxx-xxxx', () => {
  expect(formatPhoneNumber('+1 581 849-1511')).toBe('+15818491511')
})

test('Insure this phone number typing works +1 xxx xxx xxxx', () => {
  expect(formatPhoneNumber('+1 581 849 1511')).toBe('+15818491511')
})

test('Insure this phone number typing works +1xxxxxxxxxx', () => {
  expect(formatPhoneNumber('+15818491511')).toBe('+15818491511')
})

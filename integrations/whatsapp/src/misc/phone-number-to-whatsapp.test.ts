import { test, expect } from 'vitest'
import { formatPhoneNumber } from './phone-number-to-whatsapp'

test('throws on invalid phone number', () => {
  expect(() => formatPhoneNumber('garbage')).toThrow('Invalid phone number')
})

test('Argentina: removes "15" prefix, trims leading zeros, and inserts +549', () => {
  const input = '(11) 15 2345-6789'
  const actual = formatPhoneNumber(input)
  const expected = '+5491123456789'
  expect(actual).toBe(expected)
})

test('Argentina: also strips national leading zeros even without "15"', () => {
  const input = '(011) 2345 6789'
  const actual = formatPhoneNumber(input)
  const expected = '+5491123456789'
  expect(actual).toBe(expected)
})

test('Mexico: ensures +521 prefix and strips leading zeros', () => {
  const input = '55 1234 5678'
  const actual = formatPhoneNumber(input)
  const expected = '+5215512345678'
  expect(actual).toBe(expected)
})

test('Generic leading-zero cleanup for countries other than AR/MX', () => {
  const input = '(0151 12) 34 567'
  const actual = formatPhoneNumber(input)
  const expected = '+441511234567'
  expect(actual).toBe(expected)
})

test('Leaves already-clean e164 untouched (non-AR/MX)', () => {
  const input = '(415) 555-2671'
  const actual = formatPhoneNumber(input)
  const expected = '+14155552671'
  expect(actual).toBe(expected)
})

test('Simple case: adds leading + for e164 format', () => {
  const input = '416-555-0123'
  const actual = formatPhoneNumber(input)
  const expected = '+14165550123'
  expect(actual).toBe(expected)
})

test('Insure this phone number typing works +1 (xxx) xxx-xxxx', () => {
  const input = '+1 (581) 849-1511'
  const actual = formatPhoneNumber(input)
  const expected = '+15818491511'
  expect(actual).toBe(expected)
})

test('Insure this phone number typing works +1 xxx xxx-xxxx', () => {
  const input = '+1 581 849-1511'
  const actual = formatPhoneNumber(input)
  const expected = '+15818491511'
  expect(actual).toBe(expected)
})

test('Insure this phone number typing works +1 xxx xxx xxxx', () => {
  const input = '+1 581 849 1511'
  const actual = formatPhoneNumber(input)
  const expected = '+15818491511'
  expect(actual).toBe(expected)
})

test('Insure this phone number typing works +1xxxxxxxxxx', () => {
  const input = '+15818491511'
  const actual = formatPhoneNumber(input)
  const expected = '+15818491511'
  expect(actual).toBe(expected)
  expect(formatPhoneNumber('+15818491511')).toBe('+15818491511')
})

test('Broken 1', () => {
  const input = '5521969853304'
  const actual = formatPhoneNumber(input)
  const expected = '+5521969853304'
  expect(actual).toBe(expected)
})

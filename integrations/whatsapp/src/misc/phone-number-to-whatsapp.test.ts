import { test, expect } from 'vitest'
import { formatPhoneNumber } from './phone-number-to-whatsapp'

test('throws on invalid text', () => {
  expect(() => formatPhoneNumber('garbage')).toThrow('Invalid phone number')
})

test('throws on invalid phone number', () => {
  expect(() => formatPhoneNumber('1')).toThrow('Invalid phone number')
})

test('Argentina: removes "15" prefix, trims leading zeros, and inserts +549 (mobile)', () => {
  const input = '+54 (11) 15 2345-6789'
  const actual = formatPhoneNumber(input)
  const expected = '+5491123456789'
  expect(actual).toBe(expected)
})

test('Argentina: also strips national leading zeros even without "15" (fixed-line)', () => {
  const input = '+54 (011) 2345 6789'
  const actual = formatPhoneNumber(input)
  const expected = '+5491123456789'
  expect(actual).toBe(expected)
})

test('Mexico: ensures +521 prefix', () => {
  const input = '+52 55 1234 5678'
  const actual = formatPhoneNumber(input)
  const expected = '+5215512345678'
  expect(actual).toBe(expected)
})

test('Mexico: +521 already entered correctly', () => {
  const input = '+5211234567890'
  const actual = formatPhoneNumber(input)
  const expected = '+5211234567890'
  expect(actual).toBe(expected)
})

test('Generic leading-zero cleanup for countries other than AR/MX', () => {
  const input = '+44 (0151 12) 34 567'
  const actual = formatPhoneNumber(input)
  const expected = '+441511234567'
  expect(actual).toBe(expected)
})

test('Ensure this phone number typing works +1 (xxx) xxx-xxxx', () => {
  const input = '+1 (581) 849-1511'
  const actual = formatPhoneNumber(input)
  const expected = '+15818491511'
  expect(actual).toBe(expected)
})

test('Ensure this phone number typing works +1 xxx xxx-xxxx', () => {
  const input = '+1 581 849-1511'
  const actual = formatPhoneNumber(input)
  const expected = '+15818491511'
  expect(actual).toBe(expected)
})

test('Ensure this phone number typing works +1 xxx xxx xxxx', () => {
  const input = '+1 581 849 1511'
  const actual = formatPhoneNumber(input)
  const expected = '+15818491511'
  expect(actual).toBe(expected)
})

test('Ensure this phone number typing works +1xxxxxxxxxx', () => {
  const input = '+15818491511'
  const actual = formatPhoneNumber(input)
  const expected = '+15818491511'
  expect(actual).toBe(expected)
  expect(formatPhoneNumber('+15818491511')).toBe('+15818491511')
})

test('Ensure this phone number typing works 1 (xxx) xxx-xxxx', () => {
  const input = '1 (581) 849-1511'
  const actual = formatPhoneNumber(input)
  const expected = '+15818491511'
  expect(actual).toBe(expected)
})

test('Ensure this phone number typing works 1 xxx xxx-xxxx', () => {
  const input = '1 581 849-1511'
  const actual = formatPhoneNumber(input)
  const expected = '+15818491511'
  expect(actual).toBe(expected)
})

test('Ensure this phone number typing works 1 xxx xxx xxxx', () => {
  const input = '1 581 849 1511'
  const actual = formatPhoneNumber(input)
  const expected = '+15818491511'
  expect(actual).toBe(expected)
})

test('Ensure this phone number typing works 1xxxxxxxxxx', () => {
  const input = '15818491511'
  const actual = formatPhoneNumber(input)
  const expected = '+15818491511'
  expect(actual).toBe(expected)
})

// Automatically generated examples for all countries
const samples: Record<string, string> = {
  AE: '971501234567',
  AT: '436601234567',
  AU: '61412345678',
  BD: '8801712345678',
  BE: '32470123456',
  BG: '359881234567',
  BR: '5521969853304',
  CA: '14165551234',
  CH: '41791234567',
  CL: '56947590871',
  CN: '8613812345678',
  CO: '573001234567',
  CR: '50670123456',
  CZ: '420601234567',
  DE: '4915123456789',
  DK: '4520123456',
  DO: '18299565525',
  EG: '201001234567',
  ES: '34600123456',
  FI: '358401234567',
  FR: '33632467939',
  GB: '447911123456',
  GR: '306912345678',
  HK: '85291234567',
  HR: '385981234567',
  HU: '36301234567',
  ID: '628123456789',
  IE: '353871234567',
  IL: '97233741654',
  IN: '919876543210',
  IR: '989121234567',
  IS: '3546123456',
  IT: '393331234567',
  JM: '18762091234',
  JP: '819012345678',
  KE: '254701234567',
  KR: '821012345678',
  LK: '94711234567',
  MY: '60123456789',
  NG: '2348012345678',
  NL: '31612345678',
  NO: '4791234567',
  NZ: '64211234567',
  PE: '51984123456',
  PH: '639171234567',
  PK: '923001234567',
  PL: '48501234567',
  PT: '351912345678',
  RO: '40721234567',
  RU: '79161234567',
  SA: '966501234567',
  SE: '46701234567',
  SG: '6591234567',
  SI: '38640123456',
  SK: '421901234567',
  TH: '66812345678',
  TR: '905312345678',
  TW: '886912345678',
  UA: '380501234567',
  US: '14155552671',
  VE: '584121234567',
  VN: '84901234567',
  ZA: '27821234567',
}

test.each(Object.entries(samples))('Test %s', (_countryCode, num) => {
  const actual = formatPhoneNumber(num)
  const expected = `+${num}`
  expect(actual).toBe(expected)
})

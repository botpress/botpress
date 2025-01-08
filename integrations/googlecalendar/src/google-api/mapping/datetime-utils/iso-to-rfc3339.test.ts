import { describe, it, expect } from 'vitest'
import { IsoToRFC3339 } from './iso-to-rfc3339'
import sdk from '@botpress/sdk'

describe('IsoToRFC3339.convertDate', () => {
  it.each([
    // RFC3339 / ISO8601
    ['full RFC3339', '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z'],
    ['RFC3339 with ms', '2024-01-01T00:00:00.123Z', '2024-01-01T00:00:00.123Z'],
    ['positive UTC offset', '2024-01-01T00:00:00+00:00', '2024-01-01T00:00:00Z'],
    ['negative UTC offset', '2024-01-01T00:00:00-00:00', '2024-01-01T00:00:00Z'],
    ['positive timezone', '2024-01-01T05:00:00+05:00', '2024-01-01T00:00:00Z'],
    ['negative timezone', '2024-01-01T00:00:00-05:00', '2024-01-01T05:00:00Z'],
    ['compact timezone', '2024-01-01T00:00:00+0000', '2024-01-01T00:00:00Z'],

    // Partial dates (interpreted as local time and converted to UTC)
    ['date only', '2024-01-01', '2024-01-01T00:00:00Z'],
    //['date and hours', '2024-01-01T12', '2024-01-01T12:00:00Z'],
    ['date and time', '2024-01-01T12:30', '2024-01-01T12:30:00Z'],
    ['date and time with seconds', '2024-01-01T12:30:45', '2024-01-01T12:30:45Z'],
    ['date and time with ms', '2024-01-01T12:30:45.123', '2024-01-01T12:30:45.123Z'],

    // Common formats
    ['date with spaces', '2024-01-01 00:00:00', '2024-01-01T00:00:00Z'],
    ['date with spaces and ms', '2024-01-01 00:00:00.123', '2024-01-01T00:00:00.123Z'],
    ['date with spaces and timezone', '2024-01-01 00:00:00 Z', '2024-01-01T00:00:00Z'],
  ])('converts %s correctly', (_, input, expected) => {
    expect(IsoToRFC3339.convertDate(input)).toBe(expected)
  })

  it('handles Date object input', () => {
    const date = new Date('2024-01-01T00:00:00Z')
    expect(IsoToRFC3339.convertDate(date)).toBe('2024-01-01T00:00:00Z')
  })

  it('preserves milliseconds from Date object', () => {
    const date = new Date('2024-01-01T00:00:00.123Z')
    expect(IsoToRFC3339.convertDate(date)).toBe('2024-01-01T00:00:00.123Z')
  })

  it('omits milliseconds when zero', () => {
    const date = new Date('2024-01-01T00:00:00.000Z')
    expect(IsoToRFC3339.convertDate(date)).toBe('2024-01-01T00:00:00Z')
  })

  describe('time components', () => {
    it('handles hours correctly', () => {
      const date = new Date('2024-01-01T00:00:00Z')
      date.setUTCHours(23)
      expect(IsoToRFC3339.convertDate(date)).toBe('2024-01-01T23:00:00Z')
    })

    it('handles minutes correctly', () => {
      const date = new Date('2024-01-01T00:00:00Z')
      date.setUTCMinutes(59)
      expect(IsoToRFC3339.convertDate(date)).toBe('2024-01-01T00:59:00Z')
    })

    it('handles seconds correctly', () => {
      const date = new Date('2024-01-01T00:00:00Z')
      date.setUTCSeconds(59)
      expect(IsoToRFC3339.convertDate(date)).toBe('2024-01-01T00:00:59Z')
    })

    it('handles milliseconds correctly', () => {
      const date = new Date('2024-01-01T00:00:00Z')
      date.setUTCMilliseconds(999)
      expect(IsoToRFC3339.convertDate(date)).toBe('2024-01-01T00:00:00.999Z')
    })
  })

  describe('date components', () => {
    it.each([
      [2024, 1, 1, '2024-01-01T00:00:00Z'],
      [2024, 12, 31, '2024-12-31T00:00:00Z'],
      [2024, 2, 29, '2024-02-29T00:00:00Z'], // leap year
      [1970, 1, 1, '1970-01-01T00:00:00Z'], // unix epoch
      [9999, 12, 31, '9999-12-31T00:00:00Z'], // far future
    ])('formats date %i-%i-%i correctly', (year, month, day, expected) => {
      const date = new Date(Date.UTC(year, month - 1, day))
      expect(IsoToRFC3339.convertDate(date)).toBe(expected)
    })
  })

  describe('error handling', () => {
    it.each([
      ['empty string', ''],
      ['invalid format', 'not-a-date'],
      ['invalid month', '2024-13-01'],
      ['invalid day', '2024-01-32'],
      ['garbage text', 'hello world'],
    ])('throws RuntimeError for %s', (_, invalidInput) => {
      expect(() => IsoToRFC3339.convertDate(invalidInput)).toThrow(sdk.RuntimeError)
      expect(() => IsoToRFC3339.convertDate(invalidInput)).toThrow(`Invalid date: ${invalidInput}`)
    })
  })
})

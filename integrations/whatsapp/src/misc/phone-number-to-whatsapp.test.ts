import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('awesome-phonenumber', () => {
  return {
    parsePhoneNumber: vi.fn(),
  }
})

import { parsePhoneNumber } from 'awesome-phonenumber'
import { formatPhoneNumber } from './phone-number-to-whatsapp'

type MockPN = {
  valid: boolean
  number: { e164: string }
  type?: string
  countryCode?: number
}

const asPN = (pn: Partial<MockPN>): MockPN =>
  ({
    valid: true,
    number: { e164: '+10000000000' },
    ...pn,
  }) as MockPN

describe('parseForWhatsApp (edge cases)', () => {
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    warnSpy.mockClear()
  })

  it('throws on invalid phone number', () => {
    ;(parsePhoneNumber as any).mockReturnValue(asPN({ valid: false }))
    expect(() => formatPhoneNumber('garbage', 'US')).toThrow('Invalid phone number')
  })

  it('uses default region "CA" when none is provided', () => {
    ;(parsePhoneNumber as any).mockReturnValue(asPN({ valid: true }))
    formatPhoneNumber('416-555-0123')
    expect(parsePhoneNumber).toHaveBeenCalledWith('416-555-0123', { regionCode: 'CA' })
  })

  it('Argentina: removes "15" prefix, trims leading zeros, and inserts +549', () => {
    ;(parsePhoneNumber as any).mockReturnValue(
      asPN({
        countryCode: 54,
        number: { e164: '+54150111234567' },
      })
    )
    const out = formatPhoneNumber('15 011 1234 567', 'AR')
    expect(out).toBe('+549111234567')
  })

  it('Argentina: also strips national leading zeros even without "15"', () => {
    ;(parsePhoneNumber as any).mockReturnValue(
      asPN({
        countryCode: 54,
        number: { e164: '+54001123456789' },
      })
    )
    const out = formatPhoneNumber('011 2345 6789', 'AR')
    expect(out).toBe('+5491123456789')
  })

  it('Mexico: ensures +521 prefix and strips leading zeros', () => {
    ;(parsePhoneNumber as any).mockReturnValue(
      asPN({
        countryCode: 52,
        number: { e164: '+5205574759563' },
      })
    )
    const out = formatPhoneNumber('055-7475-9563', 'MX')
    expect(out).toBe('+5215574759563')
  })

  it('Generic leading-zero cleanup for countries other than AR/MX', () => {
    ;(parsePhoneNumber as any).mockReturnValue(
      asPN({
        countryCode: 44,
        number: { e164: '+44001511234567' },
      })
    )
    const out = formatPhoneNumber('(0151 12) 34 567', 'GB')
    expect(out).toBe('+441511234567')
  })

  it('Leaves already-clean e164 untouched (non-AR/MX)', () => {
    ;(parsePhoneNumber as any).mockReturnValue(
      asPN({
        countryCode: 1,
        number: { e164: '+14155552671' },
      })
    )
    const out = formatPhoneNumber('(415) 555-2671', 'US')
    expect(out).toBe('+14155552671')
  })

  it('Simple case: adds leading + for e164 format', () => {
    ;(parsePhoneNumber as any).mockReturnValue(
      asPN({
        countryCode: 1,
        number: { e164: '14165550123' as any },
      })
    )
    const out = formatPhoneNumber('416-555-0123', 'CA')
    expect(out).toBe('+14165550123')
  })
})

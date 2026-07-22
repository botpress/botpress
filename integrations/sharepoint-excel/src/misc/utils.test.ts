import { describe, it, expect } from 'vitest'
import { parseSheetTableMapping, detectColumnType, coerceValue, formatPrivateKey } from './utils'

describe.concurrent('parseSheetTableMapping', () => {
  it('parses a JSON object string', () => {
    expect(parseSheetTableMapping('{"Sheet1":"table1","Sheet2":"table2"}')).toEqual({
      Sheet1: 'table1',
      Sheet2: 'table2',
    })
  })

  it('trims whitespace inside JSON keys and values', () => {
    expect(parseSheetTableMapping('{" Sheet1 ":" table1 "}')).toEqual({ Sheet1: 'table1' })
  })

  it('parses comma-separated pairs', () => {
    expect(parseSheetTableMapping('Sheet1:table1,Sheet2:table2')).toEqual({
      Sheet1: 'table1',
      Sheet2: 'table2',
    })
  })

  it('trims whitespace in comma-separated pairs', () => {
    expect(parseSheetTableMapping(' Sheet1 : table1 , Sheet2 : table2 ')).toEqual({
      Sheet1: 'table1',
      Sheet2: 'table2',
    })
  })

  it('throws on malformed JSON', () => {
    expect(() => parseSheetTableMapping('{not valid json}')).toThrow(/Invalid sheetTableMapping format/)
  })

  it('throws when the mapping produces no valid pairs', () => {
    expect(() => parseSheetTableMapping('')).toThrow(/Invalid sheetTableMapping format/)
    expect(() => parseSheetTableMapping('garbage-without-colon')).toThrow(/Invalid sheetTableMapping format/)
    expect(() => parseSheetTableMapping('{}')).toThrow(/Invalid sheetTableMapping format/)
  })
})

describe.concurrent('detectColumnType', () => {
  it('detects a numeric column', () => {
    expect(detectColumnType([1, 2, 3])).toBe('number')
    expect(detectColumnType(['1', '2.5', '-3'])).toBe('number')
  })

  it('detects a string column', () => {
    expect(detectColumnType(['a', 'b', 'c'])).toBe('string')
    expect(detectColumnType(['1', 'two', '3'])).toBe('string')
  })

  it('treats mixed numeric/non-numeric as string', () => {
    expect(detectColumnType([1, 'x', 3])).toBe('string')
  })

  it('defaults an empty column to string', () => {
    expect(detectColumnType([])).toBe('string')
    expect(detectColumnType([undefined, null, ''])).toBe('string')
  })

  it('ignores empty cells when all populated cells are numeric', () => {
    expect(detectColumnType(['', null, 5, undefined])).toBe('number')
  })
})

describe.concurrent('coerceValue', () => {
  it('coerces numeric values for number columns', () => {
    expect(coerceValue('42', 'number')).toBe(42)
    expect(coerceValue(3.14, 'number')).toBe(3.14)
  })

  it('returns null for empty cells in number columns', () => {
    expect(coerceValue('', 'number')).toBeNull()
    expect(coerceValue(null, 'number')).toBeNull()
    expect(coerceValue(undefined, 'number')).toBeNull()
  })

  it('falls back to the original value when a number column cell is not numeric', () => {
    expect(coerceValue('not-a-number', 'number')).toBe('not-a-number')
  })

  it('stringifies values for string columns', () => {
    expect(coerceValue(42, 'string')).toBe('42')
    expect(coerceValue('hello', 'string')).toBe('hello')
  })

  it('returns empty string for empty cells in string columns', () => {
    expect(coerceValue('', 'string')).toBe('')
    expect(coerceValue(null, 'string')).toBe('')
    expect(coerceValue(undefined, 'string')).toBe('')
  })
})

describe.concurrent('formatPrivateKey', () => {
  const KEY_BODY = 'A'.repeat(200)

  it('wraps a bare key body into valid 64-char-per-line PEM', () => {
    const pem = formatPrivateKey(KEY_BODY)
    const lines = pem.split('\n')
    expect(lines[0]).toBe('-----BEGIN PRIVATE KEY-----')
    expect(lines[lines.length - 1]).toBe('-----END PRIVATE KEY-----')
    const bodyLines = lines.slice(1, -1)
    // 200 chars => 64 + 64 + 64 + 8
    expect(bodyLines).toEqual(['A'.repeat(64), 'A'.repeat(64), 'A'.repeat(64), 'A'.repeat(8)])
  })

  it('round-trips an already-formatted PEM key back to the same body', () => {
    const original = formatPrivateKey(KEY_BODY)
    const reformatted = formatPrivateKey(original)
    expect(reformatted).toBe(original)
  })

  it('strips existing PKCS#8 headers/footers and arbitrary whitespace', () => {
    const messy = `-----BEGIN PRIVATE KEY-----\n  ${KEY_BODY.slice(0, 100)} \r\n ${KEY_BODY.slice(100)}\n-----END PRIVATE KEY-----`
    expect(formatPrivateKey(messy)).toBe(formatPrivateKey(KEY_BODY))
  })

  it('strips RSA (PKCS#1) headers/footers', () => {
    const rsa = `-----BEGIN RSA PRIVATE KEY-----\n${KEY_BODY}\n-----END RSA PRIVATE KEY-----`
    expect(formatPrivateKey(rsa)).toBe(formatPrivateKey(KEY_BODY))
  })
})

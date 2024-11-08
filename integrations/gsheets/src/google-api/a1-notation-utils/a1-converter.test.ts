// a1-converter.test.ts
import { describe, it, expect } from 'vitest'
import { A1Converter } from './a1-converter'

describe.concurrent('A1Converter', () => {
  it('converts empty range to ":"', () => {
    const range = {}
    expect(A1Converter.gridRangeToA1(range)).toBe(':')
  })

  it('converts single cell range', () => {
    const range = {
      startColumnIndex: 0,
      startRowIndex: 0,
      endColumnIndex: 1,
      endRowIndex: 1,
    }
    expect(A1Converter.gridRangeToA1(range)).toBe('A1')
  })

  it('converts multi-cell range', () => {
    const range = {
      startColumnIndex: 0,
      startRowIndex: 0,
      endColumnIndex: 2,
      endRowIndex: 2,
    }
    expect(A1Converter.gridRangeToA1(range)).toBe('A1:B2')
  })

  it('handles unbounded start range', () => {
    const range = {
      endColumnIndex: 2,
      endRowIndex: 2,
    }
    expect(A1Converter.gridRangeToA1(range)).toBe(':B2')
  })

  it('handles unbounded end range', () => {
    const range = {
      startColumnIndex: 0,
      startRowIndex: 0,
    }
    expect(A1Converter.gridRangeToA1(range)).toBe('A1:')
  })

  it('converts columns beyond Z correctly', () => {
    const range = {
      startColumnIndex: 26,
      startRowIndex: 0,
      endColumnIndex: 28,
      endRowIndex: 2,
    }
    expect(A1Converter.gridRangeToA1(range)).toBe('AA1:AB2')
  })

  it('handles null values', () => {
    const range = {
      startColumnIndex: null,
      startRowIndex: null,
      endColumnIndex: null,
      endRowIndex: null,
    }
    expect(A1Converter.gridRangeToA1(range)).toBe(':')
  })

  it('handles large column indices', () => {
    const range = {
      startColumnIndex: 701, // Should be 'ZZ'
      startRowIndex: 0,
    }
    expect(A1Converter.gridRangeToA1(range)).toBe('ZZ1:')
  })

  it('handles large row indices', () => {
    const range = {
      startColumnIndex: 0,
      startRowIndex: 999,
    }
    expect(A1Converter.gridRangeToA1(range)).toBe('A1000:')
  })
})

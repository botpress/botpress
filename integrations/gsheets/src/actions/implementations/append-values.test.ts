import { describe, it, expect } from 'vitest'
import { constructRangeFromStartColumn } from './append-values-utils'

describe.concurrent('constructRangeFromStartColumn', () => {
  it('constructs range for simple column without sheet name', () => {
    expect(constructRangeFromStartColumn(undefined, 'A')).toBe('A:A100000')
    expect(constructRangeFromStartColumn(undefined, 'ZZ')).toBe('ZZ:ZZ100000')
  })

  it('constructs range for column with sheet name', () => {
    expect(constructRangeFromStartColumn('Sheet1', 'A')).toBe('Sheet1!A:A100000')
    expect(constructRangeFromStartColumn('Sheet1', 'B')).toBe('Sheet1!B:B100000')
    expect(constructRangeFromStartColumn('My Sheet', 'C')).toBe('My Sheet!C:C100000')
    expect(constructRangeFromStartColumn('Sheet1', 'AA')).toBe('Sheet1!AA:AA100000')
  })

  it('handles sheet names with special characters', () => {
    expect(constructRangeFromStartColumn("'My Sheet'", 'A')).toBe("'My Sheet'!A:A100000")
    expect(constructRangeFromStartColumn("'Sheet 1'", 'B')).toBe("'Sheet 1'!B:B100000")
  })

  it('handles multi-character column names', () => {
    expect(constructRangeFromStartColumn(undefined, 'AB')).toBe('AB:AB100000')
    expect(constructRangeFromStartColumn(undefined, 'ABC')).toBe('ABC:ABC100000')
    expect(constructRangeFromStartColumn('Sheet1', 'XYZ')).toBe('Sheet1!XYZ:XYZ100000')
  })

  it('handles empty string sheet name as undefined', () => {
    expect(constructRangeFromStartColumn('', 'A')).toBe('A:A100000')
    expect(constructRangeFromStartColumn('', 'B')).toBe('B:B100000')
  })

  it('preserves sheet name format exactly', () => {
    expect(constructRangeFromStartColumn('Sheet1', 'A')).toBe('Sheet1!A:A100000')
    expect(constructRangeFromStartColumn('  Sheet1  ', 'A')).toBe('  Sheet1  !A:A100000')
  })
})

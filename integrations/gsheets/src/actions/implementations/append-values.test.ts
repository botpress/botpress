import { describe, it, expect } from 'vitest'
import { constructRangeFromStartColumn } from './append-values-utils'

describe.concurrent('constructRangeFromStartColumn', () => {
  it('constructs range for simple column without sheet name', () => {
    expect(constructRangeFromStartColumn(undefined, 'A')).toBe('A:A')
    expect(constructRangeFromStartColumn(undefined, 'ZZ')).toBe('ZZ:ZZ')
  })

  it('constructs range for column with sheet name', () => {
    expect(constructRangeFromStartColumn('Sheet1', 'A')).toBe('Sheet1!A:A')
    expect(constructRangeFromStartColumn('Sheet1', 'B')).toBe('Sheet1!B:B')
    expect(constructRangeFromStartColumn('Sheet1', 'AA')).toBe('Sheet1!AA:AA')
  })

  it('auto-quotes sheet names with spaces', () => {
    expect(constructRangeFromStartColumn('My Sheet', 'A')).toBe("'My Sheet'!A:A")
    expect(constructRangeFromStartColumn('Decision Log', 'C')).toBe("'Decision Log'!C:C")
  })

  it('does not double-quote already quoted sheet names', () => {
    expect(constructRangeFromStartColumn("'My Sheet'", 'A')).toBe("'My Sheet'!A:A")
    expect(constructRangeFromStartColumn("'Sheet 1'", 'B')).toBe("'Sheet 1'!B:B")
  })

  it('quotes sheet names with special characters', () => {
    expect(constructRangeFromStartColumn('Sheet-1', 'A')).toBe("'Sheet-1'!A:A")
    expect(constructRangeFromStartColumn('Sheet.1', 'A')).toBe("'Sheet.1'!A:A")
  })

  it('escapes single quotes (apostrophes) in sheet names', () => {
    expect(constructRangeFromStartColumn("John's Data", 'A')).toBe("'John''s Data'!A:A")
    expect(constructRangeFromStartColumn("It's a sheet", 'B')).toBe("'It''s a sheet'!B:B")
    expect(constructRangeFromStartColumn("A'B'C", 'A')).toBe("'A''B''C'!A:A")
  })

  it('does not quote simple alphanumeric/underscore sheet names', () => {
    expect(constructRangeFromStartColumn('Sheet1', 'A')).toBe('Sheet1!A:A')
    expect(constructRangeFromStartColumn('My_Sheet', 'A')).toBe('My_Sheet!A:A')
  })

  it('handles multi-character column names', () => {
    expect(constructRangeFromStartColumn(undefined, 'AB')).toBe('AB:AB')
    expect(constructRangeFromStartColumn(undefined, 'ABC')).toBe('ABC:ABC')
    expect(constructRangeFromStartColumn('Sheet1', 'XYZ')).toBe('Sheet1!XYZ:XYZ')
  })

  it('handles empty string sheet name as undefined', () => {
    expect(constructRangeFromStartColumn('', 'A')).toBe('A:A')
    expect(constructRangeFromStartColumn('', 'B')).toBe('B:B')
  })
})

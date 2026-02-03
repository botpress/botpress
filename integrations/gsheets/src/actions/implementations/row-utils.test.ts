import { describe, it, expect } from 'vitest'
import {
  columnLetterToIndex,
  indexToColumnLetter,
  buildSheetPrefix,
  buildRowRange,
  buildColumnRange,
} from './row-utils'

describe.concurrent('columnLetterToIndex', () => {
  it('converts single letters A-Z to indices 0-25', () => {
    expect(columnLetterToIndex('A')).toBe(0)
    expect(columnLetterToIndex('B')).toBe(1)
    expect(columnLetterToIndex('Z')).toBe(25)
  })

  it('converts double letters starting with AA', () => {
    expect(columnLetterToIndex('AA')).toBe(26)
    expect(columnLetterToIndex('AB')).toBe(27)
    expect(columnLetterToIndex('AZ')).toBe(51)
  })

  it('converts BA and beyond', () => {
    expect(columnLetterToIndex('BA')).toBe(52)
    expect(columnLetterToIndex('ZZ')).toBe(701)
  })

  it('is case-insensitive', () => {
    expect(columnLetterToIndex('a')).toBe(0)
    expect(columnLetterToIndex('aa')).toBe(26)
    expect(columnLetterToIndex('Aa')).toBe(26)
  })
})

describe.concurrent('indexToColumnLetter', () => {
  it('converts indices 0-25 to single letters A-Z', () => {
    expect(indexToColumnLetter(0)).toBe('A')
    expect(indexToColumnLetter(1)).toBe('B')
    expect(indexToColumnLetter(25)).toBe('Z')
  })

  it('converts index 26+ to double letters', () => {
    expect(indexToColumnLetter(26)).toBe('AA')
    expect(indexToColumnLetter(27)).toBe('AB')
    expect(indexToColumnLetter(51)).toBe('AZ')
  })

  it('converts higher indices correctly', () => {
    expect(indexToColumnLetter(52)).toBe('BA')
    expect(indexToColumnLetter(701)).toBe('ZZ')
  })
})

describe.concurrent('columnLetterToIndex and indexToColumnLetter roundtrip', () => {
  it('indexToColumnLetter inverts columnLetterToIndex', () => {
    const letters = ['A', 'Z', 'AA', 'AZ', 'BA', 'ZZ']
    for (const letter of letters) {
      expect(indexToColumnLetter(columnLetterToIndex(letter))).toBe(letter)
    }
  })

  it('columnLetterToIndex inverts indexToColumnLetter', () => {
    const indices = [0, 25, 26, 51, 52, 701]
    for (const index of indices) {
      expect(columnLetterToIndex(indexToColumnLetter(index))).toBe(index)
    }
  })
})

describe.concurrent('buildSheetPrefix', () => {
  it('returns empty string when no sheet title', () => {
    expect(buildSheetPrefix()).toBe('')
    expect(buildSheetPrefix(undefined)).toBe('')
  })

  it('returns simple prefix for alphanumeric titles', () => {
    expect(buildSheetPrefix('Sheet1')).toBe('Sheet1!')
    expect(buildSheetPrefix('Data')).toBe('Data!')
  })

  it('quotes titles containing spaces', () => {
    expect(buildSheetPrefix('My Sheet')).toBe("'My Sheet'!")
  })

  it('quotes and escapes titles containing apostrophes', () => {
    expect(buildSheetPrefix("It's")).toBe("'It''s'!")
    expect(buildSheetPrefix("Don't stop")).toBe("'Don''t stop'!")
  })
})

describe.concurrent('buildRowRange', () => {
  it('builds simple row range with defaults', () => {
    expect(buildRowRange({ rowIndex: 1 })).toBe('A1:1')
  })

  it('builds row range with explicit start and end columns', () => {
    expect(buildRowRange({ rowIndex: 5, startColumn: 'B', endColumn: 'D' })).toBe('B5:D5')
  })

  it('includes sheet prefix when provided', () => {
    expect(buildRowRange({ sheetTitle: 'Data', rowIndex: 3, startColumn: 'A', endColumn: 'C' })).toBe('Data!A3:C3')
  })

  it('handles sheet titles requiring quotes', () => {
    expect(buildRowRange({ sheetTitle: 'My Data', rowIndex: 1, endColumn: 'B' })).toBe("'My Data'!A1:B1")
  })
})

describe.concurrent('buildColumnRange', () => {
  it('builds single column range with defaults', () => {
    expect(buildColumnRange({})).toBe('A1:A100000')
  })

  it('builds range for specified columns', () => {
    expect(buildColumnRange({ startColumn: 'B', endColumn: 'D' })).toBe('B1:D100000')
  })

  it('uses startColumn as endColumn when endColumn not specified', () => {
    expect(buildColumnRange({ startColumn: 'C' })).toBe('C1:C100000')
  })

  it('respects custom maxRow', () => {
    expect(buildColumnRange({ startColumn: 'A', endColumn: 'B', maxRow: 500 })).toBe('A1:B500')
  })

  it('includes sheet prefix when provided', () => {
    expect(buildColumnRange({ sheetTitle: 'Sales', startColumn: 'A', endColumn: 'C' })).toBe('Sales!A1:C100000')
  })
})

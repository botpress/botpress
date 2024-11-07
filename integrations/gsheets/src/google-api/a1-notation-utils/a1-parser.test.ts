import { describe, it, expect } from 'vitest'
import { A1NotationParser } from './a1-parser'

describe.concurrent('A1NotationParser', () => {
  const validCases = [
    [
      'Sheet1!A1:B2',
      {
        startRowIndex: 0,
        endRowIndex: 2,
        startColumnIndex: 0,
        endColumnIndex: 2,
      },
    ],
    [
      'Sheet1!A:A',
      {
        startColumnIndex: 0,
        endColumnIndex: 1,
      },
    ],
    [
      'Sheet1!1:2',
      {
        startRowIndex: 0,
        endRowIndex: 2,
      },
    ],
    [
      'Sheet1!A5:A',
      {
        startRowIndex: 4,
        startColumnIndex: 0,
        endColumnIndex: 1,
      },
    ],
    [
      'A1',
      {
        startRowIndex: 0,
        endRowIndex: 1,
        startColumnIndex: 0,
        endColumnIndex: 1,
      },
    ],
    [
      'B2:E9',
      {
        startRowIndex: 1,
        endRowIndex: 9,
        startColumnIndex: 1,
        endColumnIndex: 5,
      },
    ],
    [
      'AA1:ZZ2',
      {
        startRowIndex: 0,
        endRowIndex: 2,
        startColumnIndex: 26,
        endColumnIndex: 702,
      },
    ],
  ] as const

  it.each(validCases)('correctly parses %s', (input, expected) => {
    expect(A1NotationParser.parse(input)).toEqual(expected)
  })

  const errorCases = [
    ['', 'Range cannot be empty'],
    ['!', 'Range part cannot be empty'],
    ['Sheet1!', 'Range part cannot be empty'],
    ['Sheet1!:', 'Start cell reference cannot be empty'],
    [':', 'Start cell reference cannot be empty'],
    ['Sheet1!@#$', 'Invalid cell format: @#$'],
    ['A1:@#$', 'Invalid cell format: @#$'],
    ['@#$', 'Invalid cell format: @#$'],
  ] as const

  it.each(errorCases)('throws on %s', (input, expectedError) => {
    expect(() => A1NotationParser.parse(input)).toThrowError(expectedError)
  })
})

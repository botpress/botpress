import * as stringUtils from './strings'

describe('String utils', () => {
  test('countAlpha', () => {
    expect(stringUtils.countAlpha('')).toEqual(0)
    expect(stringUtils.countAlpha('A')).toEqual(1)
    expect(stringUtils.countAlpha('4')).toEqual(0)
    expect(stringUtils.countAlpha('µ')).toEqual(0)
    expect(stringUtils.countAlpha('    ')).toEqual(0)
    expect(stringUtils.countAlpha('  A  ')).toEqual(1)
    expect(stringUtils.countAlpha('  4 ')).toEqual(0)
    expect(stringUtils.countAlpha('  µ ')).toEqual(0)
    expect(stringUtils.countAlpha('MyNaµis åntH0n¥')).toEqual(10)
  })

  test('countNum', () => {
    expect(stringUtils.countNum('')).toEqual(0)
    expect(stringUtils.countNum('A')).toEqual(0)
    expect(stringUtils.countNum('4')).toEqual(1)
    expect(stringUtils.countNum('µ')).toEqual(0)
    expect(stringUtils.countNum('    ')).toEqual(0)
    expect(stringUtils.countNum('  A  ')).toEqual(0)
    expect(stringUtils.countNum('  4 ')).toEqual(1)
    expect(stringUtils.countNum('  µ ')).toEqual(0)
    expect(stringUtils.countNum('MyNaµis åntH0n¥')).toEqual(1)
  })

  test('countSpecial', () => {
    expect(stringUtils.countSpecial('')).toEqual(0)
    expect(stringUtils.countSpecial('A')).toEqual(0)
    expect(stringUtils.countSpecial('4')).toEqual(0)
    expect(stringUtils.countSpecial('µ')).toEqual(1)
    expect(stringUtils.countSpecial('     ')).toEqual(0)
    expect(stringUtils.countSpecial('  A  ')).toEqual(0)
    expect(stringUtils.countSpecial('  4 ')).toEqual(0)
    expect(stringUtils.countSpecial('  µ ')).toEqual(1)
    expect(stringUtils.countSpecial('MyNaµis åntH0n¥')).toEqual(3)
  })

  test('levenshtein', () => {
    expect(stringUtils.levenshtein('testing', 'tesing')).toEqual(1) // 1 x suppresion
    expect(stringUtils.levenshtein('testting', 'testing')).toEqual(1) // 1 x addition
    expect(stringUtils.levenshtein('tasting', 'testing')).toEqual(1) // 1 x substitution
    expect(stringUtils.levenshtein('teing', 'testing')).toEqual(2) // 2 x suppression
    expect(stringUtils.levenshtein('tesstting', 'testing')).toEqual(2) // 2 x addition
    expect(stringUtils.levenshtein('teasing', 'testing')).toEqual(2) // 1 x suppression + 1 x addition
    expect(stringUtils.levenshtein('teasing', 'testing')).toEqual(2) // 1 x suppression + 1 x addition
    expect(stringUtils.levenshtein('tastting', 'testing')).toEqual(2) // 1 x substitution + 1 x addition
    expect(stringUtils.levenshtein('tetsng', 'testing')).toEqual(2) // 1 x suppression + 1 x substitution
    expect(stringUtils.levenshtein('tetsing', 'testing')).toEqual(2) // letterSwap (1 sup + 1 add)
    expect(stringUtils.levenshtein('tetsig', 'testing')).toEqual(3) // 1 x suppression + 1 x letterSwap (1 sup + 1 add)
    expect(stringUtils.levenshtein('tetsinng', 'testing')).toEqual(3) // 1 x letterSwap (1 sup + 1 add) + 1 x addition
    expect(stringUtils.levenshtein('tetsinng', 'testing')).toEqual(3) // 1 x letterSwap (1 sup + 1 add) + 1 x addition
    expect(stringUtils.levenshtein('tetsong', 'testing')).toEqual(3) // 1 x letterSwap (1 sup + 1 add) + 1 x substitution
  })

  test('darmeau levenshtein', () => {
    expect(stringUtils.damerauLevenshtein('testing', 'tesing')).toEqual(1) // 1 x suppresion
    expect(stringUtils.damerauLevenshtein('testting', 'testing')).toEqual(1) // 1 x addition
    expect(stringUtils.damerauLevenshtein('tasting', 'testing')).toEqual(1) // 1 x substitution
    expect(stringUtils.damerauLevenshtein('teing', 'testing')).toEqual(2) // 2 x suppression
    expect(stringUtils.damerauLevenshtein('tesstting', 'testing')).toEqual(2) // 2 x addition
    expect(stringUtils.damerauLevenshtein('teasing', 'testing')).toEqual(2) // 1 x suppression + 1 x addition
    expect(stringUtils.damerauLevenshtein('teasing', 'testing')).toEqual(2) // 1 x suppression + 1 x addition
    expect(stringUtils.damerauLevenshtein('tastting', 'testing')).toEqual(2) // 1 x substitution + 1 x addition
    expect(stringUtils.damerauLevenshtein('tetsing', 'testing')).toEqual(1) // letter swap
    expect(stringUtils.damerauLevenshtein('tetsng', 'testing')).toEqual(2) // 1 x letter swap + 1 x suppression
    expect(stringUtils.damerauLevenshtein('tetsiing', 'testing')).toEqual(2) // 1 x letter swap + 1 x addition
    expect(stringUtils.damerauLevenshtein('tetsiing', 'testing')).toEqual(2) // 1 x letter swap + 1 x addition
    expect(stringUtils.damerauLevenshtein('tetsong', 'testing')).toEqual(2) // 1 x letter swap + 1 x substitution
  })
})

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
})

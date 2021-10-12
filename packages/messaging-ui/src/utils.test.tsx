/**
 * @jest-environment jsdom
 */
import { pick } from './utils'

describe('pick', () => {
  test('all existant keys', () => {
    const obj = { a: 1, b: 2, c: 3 }
    const picked = pick(obj, ['a', 'c'])
    expect(picked).toEqual({ a: 1, c: 3 })
  })

  test('some missing keys', () => {
    const obj = { a: 1, c: 3 }
    const picked = pick<any>(obj, ['a', 'b'])
    expect(picked).toEqual({ a: 1 })
  })

  test('all missing keys', () => {
    const obj = { a: 1, c: 3 }
    const picked = pick<any>(obj, ['f', 'x'])
    expect(picked).toEqual({})
  })
})

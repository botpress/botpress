import { test, expect } from 'vitest'
import * as recordUtils from './record-utils'

test('zip objects should return both values only when key is defined in both objects', () => {
  const objA = { a: 1, b: 2, c: 3 }
  const objB = { c: 4, d: 5 }

  const zipped = recordUtils.zipObjects(objA, objB)

  const expected = {
    a: [1, null],
    b: [2, null],
    c: [3, 4],
    d: [null, 5],
  }

  expect(zipped).toEqual(expected)
})

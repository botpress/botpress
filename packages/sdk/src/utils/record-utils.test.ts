import { test, describe, expect } from 'vitest'

import { stripUndefinedProps } from './record-utils'

describe.concurrent('stripUndefinedProps', () => {
  test('should strip undefined props', () => {
    // Arrange
    const obj = {
      a: 1,
      b: undefined,
      c: 3,
    }

    // Act
    const result = stripUndefinedProps(obj)

    // Assert
    expect(result).toEqual({ a: 1, c: 3 })
  })

  test.for([null, false, '', 0, NaN, 0n])('should not strip non-undefined falsy props: %s', (falsyValue) => {
    // Arrange
    const obj = {
      a: 1,
      b: falsyValue,
      c: 3,
    }

    // Act
    const result = stripUndefinedProps(obj)

    // Assert
    expect(result).toEqual({ a: 1, b: falsyValue, c: 3 })
  })
})

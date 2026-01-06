import { describe, it, expect } from 'vitest'
import { isEqual } from './is-equal'
import * as lodash from 'lodash-es'

describe.concurrent('custom isEqual', () => {
  describe.concurrent('primitive values', () => {
    it('should compare numbers correctly', () => {
      // Arrange
      const num1 = 1
      const num2 = 2
      const zero = 0
      const negZero = -0
      const nan1 = NaN
      const nan2 = NaN

      // Act & Assert
      expect(isEqual(num1, num1)).toBe(true)
      expect(isEqual(num1, num2)).toBe(false)
      expect(isEqual(zero, zero)).toBe(true)
      expect(isEqual(zero, negZero)).toBe(true) // Same as lodash behavior
      expect(isEqual(nan1, nan2)).toBe(true) // lodash treats NaN as equal to itself
    })

    it('should compare strings correctly', () => {
      // Arrange
      const str1 = 'abc'
      const str2 = 'abc'
      const str3 = 'def'
      const empty1 = ''
      const empty2 = ''

      // Act & Assert
      expect(isEqual(str1, str2)).toBe(true)
      expect(isEqual(str1, str3)).toBe(false)
      expect(isEqual(empty1, empty2)).toBe(true)
    })

    it('should compare booleans correctly', () => {
      // Arrange
      const bool1 = true
      const bool2 = true
      const bool3 = false

      // Act & Assert
      expect(isEqual(bool1, bool2)).toBe(true)
      expect(isEqual(bool3, bool3)).toBe(true)
      expect(isEqual(bool1, bool3)).toBe(false)
    })

    it('should compare null and undefined correctly', () => {
      // Arrange
      const null1 = null
      const null2 = null
      const undef1 = undefined
      const undef2 = undefined

      // Act & Assert
      expect(isEqual(null1, null2)).toBe(true)
      expect(isEqual(undef1, undef2)).toBe(true)
      expect(isEqual(null1, undef1)).toBe(false)
    })

    it('should compare symbols correctly', () => {
      // Arrange
      const symbol1 = Symbol('test')
      const symbol2 = Symbol('test')

      // Act & Assert
      expect(isEqual(symbol1, symbol1)).toBe(true)
      expect(isEqual(symbol1, symbol2)).toBe(false)
    })
  })

  describe.concurrent('arrays', () => {
    it('should compare simple arrays correctly', () => {
      // Arrange
      const arr1 = [1, 2, 3]
      const arr2 = [1, 2, 3]
      const arr3 = [1, 2, 4]
      const arr4 = [1, 2]

      // Act & Assert
      expect(isEqual(arr1, arr2)).toBe(true)
      expect(isEqual(arr1, arr3)).toBe(false)
      expect(isEqual(arr1, arr4)).toBe(false)
    })

    it('should compare nested arrays correctly', () => {
      // Arrange
      const nested1 = [1, [2, 3]]
      const nested2 = [1, [2, 3]]
      const nested3 = [1, [2, 4]]

      // Act & Assert
      expect(isEqual(nested1, nested2)).toBe(true)
      expect(isEqual(nested1, nested3)).toBe(false)
    })

    it('should compare arrays with different object references but same values', () => {
      // Arrange
      const obj1 = { a: 1 }
      const obj2 = { a: 1 }
      const arrWithObj1 = [obj1]
      const arrWithObj2 = [obj2]

      // Act & Assert
      expect(isEqual(arrWithObj1, arrWithObj2)).toBe(true)
    })
  })

  describe.concurrent('objects', () => {
    it('should compare simple objects correctly', () => {
      // Arrange
      const obj1 = { a: 1, b: 2 }
      const obj2 = { a: 1, b: 2 }
      const obj3 = { a: 1, b: 3 }
      const obj4 = { a: 1 }

      // Act & Assert
      expect(isEqual(obj1, obj2)).toBe(true)
      expect(isEqual(obj1, obj3)).toBe(false)
      expect(isEqual(obj1, obj4)).toBe(false)
    })

    it('should compare nested objects correctly', () => {
      // Arrange
      const nested1 = { a: 1, b: { c: 2 } }
      const nested2 = { a: 1, b: { c: 2 } }
      const nested3 = { a: 1, b: { c: 3 } }

      // Act & Assert
      expect(isEqual(nested1, nested2)).toBe(true)
      expect(isEqual(nested1, nested3)).toBe(false)
    })

    it('should ignore properties order', () => {
      // Arrange
      const obj1 = { a: 1, b: 2 }
      const obj2 = { b: 2, a: 1 }

      // Act & Assert
      expect(isEqual(obj1, obj2)).toBe(true)
    })

    it('should handle object prototypes correctly', () => {
      // Arrange
      class Test {
        prop = 1
      }

      const obj1 = new Test()
      const obj2 = new Test()
      const obj3 = { prop: 1 }

      // Act & Assert
      expect(isEqual(obj1, obj2)).toBe(true)
      // lodash considers these equal since it compares enumerable properties
      expect(isEqual(obj1, obj3)).toBe(lodash.isEqual(obj1, obj3))
    })
  })

  describe.concurrent('objects with undefined values', () => {
    it('should consider objects equal if they only differ by undefined properties', () => {
      // Arrange
      const obj1 = { a: 1, b: undefined }
      const obj2 = { a: 1 }

      // Act & Assert
      expect(isEqual(obj1, obj2)).toBe(true)
      // This is different from lodash's behavior
      expect(lodash.isEqual(obj1, obj2)).toBe(false)
    })

    it('should consider objects equal if they have the same undefined properties', () => {
      // Arrange
      const obj1 = { a: 1, b: undefined }
      const obj2 = { a: 1, b: undefined }

      // Act & Assert
      expect(isEqual(obj1, obj2)).toBe(true)
    })

    it('should consider nested objects with undefined values correctly', () => {
      // Arrange
      const obj1 = { a: 1, b: { c: undefined } }
      const obj2 = { a: 1, b: {} }
      const obj3 = { a: 1, b: { c: undefined, d: 2 } }
      const obj4 = { a: 1, b: { d: 2 } }

      // Act & Assert
      expect(isEqual(obj1, obj2)).toBe(true)
      expect(isEqual(obj3, obj4)).toBe(true)
    })

    it('should handle a mix of defined and undefined properties', () => {
      // Arrange
      const obj1 = { a: 1, b: 2, c: undefined, d: null, e: 0 }
      const obj2 = { a: 1, b: 2, d: null, e: 0 }

      // Act & Assert
      expect(isEqual(obj1, obj2)).toBe(true)
    })
  })

  describe.concurrent('functions', () => {
    it('should compare functions by reference', () => {
      // Arrange
      const func1 = function () {
        return 1
      }
      const func2 = function () {
        return 1
      }

      // Act & Assert
      expect(isEqual(func1, func1)).toBe(true)
      expect(isEqual(func1, func2)).toBe(false) // Different reference
    })
  })

  describe.concurrent('dates', () => {
    it('should compare dates correctly', () => {
      // Arrange
      const date1 = new Date('1970-01-01')
      const date2 = new Date('1970-01-01')
      const date3 = new Date('1970-01-02')

      // Act & Assert
      expect(isEqual(date1, date2)).toBe(true)
      expect(isEqual(date1, date3)).toBe(false)
    })
  })

  describe.concurrent('regular expressions', () => {
    it('should compare regular expressions correctly', () => {
      // Arrange
      const regex1 = /abc/
      const regex2 = /abc/
      const regex3 = /def/
      const regex4 = /abc/g
      const regex5 = /abc/g
      const regex6 = /abc/i

      // Act & Assert
      expect(isEqual(regex1, regex2)).toBe(true)
      expect(isEqual(regex4, regex5)).toBe(true)
      expect(isEqual(regex1, regex3)).toBe(false)
      expect(isEqual(regex4, regex6)).toBe(false)
    })
  })

  describe.concurrent('maps', () => {
    it('should compare Map objects correctly', () => {
      // Arrange
      const map1 = new Map([
        ['a', 1],
        ['b', 2],
      ])
      const map2 = new Map([
        ['a', 1],
        ['b', 2],
      ])
      const map3 = new Map([
        ['a', 1],
        ['b', 3],
      ])

      // Act & Assert
      expect(isEqual(map1, map2)).toBe(true)
      expect(isEqual(map1, map3)).toBe(false)
    })

    it('should handle maps with object keys', () => {
      // Arrange
      const key1 = { id: 1 }
      const key2 = { id: 1 }
      const map1 = new Map([[key1, 'value']])
      const map2 = new Map([[key2, 'value']])

      // Act & Assert - should match lodash behavior
      expect(isEqual(map1, map2)).toBe(lodash.isEqual(map1, map2))
    })
  })

  describe.concurrent('sets', () => {
    it('should compare Set objects correctly', () => {
      // Arrange
      const set1 = new Set([1, 2, 3])
      const set2 = new Set([1, 2, 3])
      const set3 = new Set([1, 2, 4])

      // Act & Assert
      expect(isEqual(set1, set2)).toBe(true)
      expect(isEqual(set1, set3)).toBe(false)
    })

    it('should handle sets with object values', () => {
      // Arrange
      const obj1 = { id: 1 }
      const obj2 = { id: 1 }
      const set1 = new Set([obj1])
      const set2 = new Set([obj2])

      // Act & Assert - should match lodash behavior
      expect(isEqual(set1, set2)).toBe(lodash.isEqual(set1, set2))
    })
  })

  describe.concurrent('typed arrays', () => {
    it('should compare TypedArrays correctly', () => {
      // Arrange
      const uint8Array1 = new Uint8Array([1, 2, 3])
      const uint8Array2 = new Uint8Array([1, 2, 3])
      const uint8Array3 = new Uint8Array([1, 2, 4])
      const int32Array1 = new Int32Array([1, 2, 3])
      const int32Array2 = new Int32Array([1, 2, 3])
      const float64Array1 = new Float64Array([1.1, 2.2])
      const float64Array2 = new Float64Array([1.1, 2.2])

      // Act & Assert
      expect(isEqual(uint8Array1, uint8Array2)).toBe(true)
      expect(isEqual(uint8Array1, uint8Array3)).toBe(false)
      expect(isEqual(int32Array1, int32Array2)).toBe(true)
      expect(isEqual(float64Array1, float64Array2)).toBe(true)
    })

    it('should treat different typed array types as not equal', () => {
      // Arrange
      const uint8Array = new Uint8Array([1, 2, 3])
      const int8Array = new Int8Array([1, 2, 3])

      // Act & Assert
      expect(isEqual(uint8Array, int8Array)).toBe(false)
    })
  })

  describe.concurrent('mixed types', () => {
    it('should handle value types correctly', () => {
      // Arrange
      const num = 1
      const str = '1'
      const zero = 0
      const falseVal = false
      const emptyStr = ''

      // Act & Assert
      expect(isEqual(num, str)).toBe(false)
      expect(isEqual(zero, falseVal)).toBe(false)
      expect(isEqual(emptyStr, falseVal)).toBe(false)
    })

    it('should handle complex mixed structures', () => {
      // Arrange
      const complex1 = {
        a: [1, { b: 2, c: [3, new Date('1970-01-01')] }],
        d: new Set([1, 2]),
        e: new Map([['key', 'value']]),
      }

      const complex2 = {
        a: [1, { b: 2, c: [3, new Date('1970-01-01')] }],
        d: new Set([1, 2]),
        e: new Map([['key', 'value']]),
      }

      const complex3 = {
        a: [1, { b: 2, c: [3, new Date('1970-01-02')] }],
        d: new Set([1, 2]),
        e: new Map([['key', 'value']]),
      }

      // Act & Assert
      expect(isEqual(complex1, complex2)).toBe(true)
      expect(isEqual(complex1, complex3)).toBe(false)
    })
  })

  describe.concurrent('edge cases', () => {
    it('should handle circular references', () => {
      // Arrange
      const obj1: any = { a: 1 }
      const obj2: any = { a: 1 }
      obj1.self = obj1
      obj2.self = obj2

      // Act & Assert
      expect(isEqual(obj1, obj2)).toBe(true)
    })

    it('should handle circular references in arrays', () => {
      // Arrange
      const arr1: any[] = [1, 2]
      const arr2: any[] = [1, 2]
      arr1.push(arr1)
      arr2.push(arr2)

      // Act & Assert
      expect(isEqual(arr1, arr2)).toBe(true)
    })

    it('should handle null prototype objects', () => {
      // Arrange
      const obj1 = Object.create(null)
      const obj2 = Object.create(null)
      obj1.a = 1
      obj2.a = 1

      // Act & Assert
      expect(isEqual(obj1, obj2)).toBe(true)
    })

    it('should handle objects with identical circular references', () => {
      // Arrange
      const circular1: any = {}
      const circular2: any = {}
      const nested1 = { ref: circular1 }
      const nested2 = { ref: circular2 }
      circular1.nested = nested1
      circular2.nested = nested2

      // Act & Assert
      expect(isEqual(circular1, circular2)).toBe(true)
    })
  })

  describe.concurrent('comparing with lodash behavior', () => {
    it.each([
      [1, 1],
      ['test', 'test'],
      [
        [1, 2, 3],
        [1, 2, 3],
      ],
      [
        { a: 1, b: 2 },
        { a: 1, b: 2 },
      ],
      [new Date('1970-01-01'), new Date('1970-01-01')],
      [/abc/g, /abc/g],
      [new Set([1, 2]), new Set([1, 2])],
      [new Map([['a', 1]]), new Map([['a', 1]])],
    ])('should match lodash behavior for normal cases', (a, b) => {
      // Act & Assert
      expect(isEqual(a, b)).toBe(lodash.isEqual(a, b))
    })

    it('should ONLY differ from lodash for undefined values in objects', () => {
      // Arrange
      const obj1 = { a: 1, b: undefined }
      const obj2 = { a: 1 }

      // Act & Assert
      // Our implementation treats them as equal
      expect(isEqual(obj1, obj2)).toBe(true)
      // While lodash treats them as different
      expect(lodash.isEqual(obj1, obj2)).toBe(false)
    })

    it('should handle deeply nested undefined values correctly', () => {
      // Arrange
      const deep1 = {
        a: 1,
        b: {
          c: undefined,
          d: {
            e: undefined,
            f: 2,
          },
        },
      }

      const deep2 = {
        a: 1,
        b: {
          d: {
            f: 2,
          },
        },
      }

      // Act & Assert
      // Our implementation treats them as equal
      expect(isEqual(deep1, deep2)).toBe(true)
      // lodash treats them as different
      expect(lodash.isEqual(deep1, deep2)).toBe(false)
    })
  })
})

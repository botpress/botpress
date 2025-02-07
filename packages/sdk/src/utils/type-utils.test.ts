import { test, describe } from 'vitest'
import * as utils from './type-utils'

describe('AtLeastOne<T>', () => {
  test('should not allow less than one element', () => {
    type A = utils.AtLeastOne<number>
    type B = []
    type _assertion = utils.AssertAll<
      [
        //
        utils.AssertNotExtends<B, A>,
      ]
    >
  })

  test('should allow one element', () => {
    type A = utils.AtLeastOne<number>
    type B = [1]
    type _assertion = utils.AssertAll<
      [
        //
        utils.AssertExtends<B, A>,
      ]
    >
  })

  test('should allow 2+ elements', () => {
    type A = utils.AtLeastOne<number>
    type B = [1, 3, 4, 5, 6]
    type _assertion = utils.AssertAll<
      [
        //
        utils.AssertExtends<B, A>,
      ]
    >
  })
})

describe('AtLeastOneProperty<T>', () => {
  test('should not allow less than one property', () => {
    type A = utils.AtLeastOneProperty<{ foo: number; bar: string }>
    type B = {}
    type _assertion = utils.AssertAll<
      [
        //
        utils.AssertNotExtends<B, A>,
      ]
    >
  })

  test('should allow one property', () => {
    type A = utils.AtLeastOneProperty<{ foo: number; bar: string }>
    type B = { foo: 1 }
    type _assertion = utils.AssertAll<
      [
        //
        utils.AssertExtends<B, A>,
      ]
    >
  })

  test('should allow 2+ properties', () => {
    type A = utils.AtLeastOneProperty<{ foo: number; bar: string }>
    type B = { foo: 1; bar: 'bar' }
    type _assertion = utils.AssertAll<
      [
        //
        utils.AssertExtends<B, A>,
      ]
    >
  })

  test('should disallow properties that do not exist in T', () => {
    type HasExactKeys<T, U> = [keyof T] extends [keyof U] ? ([keyof U] extends [keyof T] ? true : false) : false
    type IsInvalidAtLeastOne<T, U> = T extends U ? (HasExactKeys<T, U> extends true ? false : true) : true

    type A = utils.AtLeastOneProperty<{ foo: number; bar: string }>
    type B = { foo: 1; baz: 'baz' }
    type _assertion = utils.AssertAll<
      [
        //
        IsInvalidAtLeastOne<B, A>,
      ]
    >
  })
})

describe('ExactlyOneProperty<T>', () => {
  test('should not allow less than one property', () => {
    type A = utils.ExactlyOneProperty<{ foo: number; bar: string }>
    type B = {}
    type _assertion = utils.AssertAll<
      [
        //
        utils.AssertNotExtends<B, A>,
      ]
    >
  })

  test('should allow one property', () => {
    type A = utils.ExactlyOneProperty<{ foo: number; bar: string }>
    type B = { foo: 1 }
    type _assertion = utils.AssertAll<
      [
        //
        utils.AssertExtends<B, A>,
      ]
    >
  })

  test('should not allow 2+ properties', () => {
    type A = utils.ExactlyOneProperty<{ foo: number; bar: string }>
    type B = { foo: 1; bar: 'bar' }
    type _assertion = utils.AssertAll<
      [
        //
        utils.AssertNotExtends<B, A>,
      ]
    >
  })

  test('should disallow properties that do not exist in T', () => {
    type A = utils.ExactlyOneProperty<{ foo: number; bar: string }>
    type B = { baz: 'baz' }
    type _assertion = utils.AssertAll<
      [
        //
        utils.AssertNotExtends<B, A>,
      ]
    >
  })
})

test('SafeCast should not cast if T extends U', () => {
  type A = utils.SafeCast<'foo', string>
  type B = 'foo'
  type _assertion = utils.AssertAll<
    [
      //
      utils.AssertExtends<A, B>,
      utils.AssertExtends<B, A>,
      utils.AssertTrue<utils.IsEqual<A, B>>,
    ]
  >
})

test('SafeCast should not cast to U is T is not U', () => {
  type A = utils.SafeCast<'foo', number>
  type B = number
  type _assertion = utils.AssertAll<
    [
      //
      utils.AssertExtends<A, B>,
      utils.AssertExtends<B, A>,
      utils.AssertTrue<utils.IsEqual<A, B>>,
    ]
  >
})

test('SafeCast should cast to U if T is never', () => {
  type A = utils.SafeCast<never, string>
  type B = string
  type _assertion = utils.AssertAll<
    [
      //
      utils.AssertExtends<A, B>,
      utils.AssertExtends<B, A>,
      utils.AssertTrue<utils.IsEqual<A, B>>,
    ]
  >
})

test('join should concatenate strings', () => {
  type A = utils.Join<['a', 'b', 'c']>
  type B = 'abc'
  type _assertion = utils.AssertAll<
    [
      //
      utils.AssertExtends<A, B>,
      utils.AssertExtends<B, A>,
      utils.AssertTrue<utils.IsEqual<A, B>>,
    ]
  >
})

test('split should split strings', () => {
  type A = utils.Split<'a.b.c', '.'>
  type B = ['a', 'b', 'c']
  type _assertion = utils.AssertAll<
    [
      //
      utils.AssertExtends<A, B>,
      utils.AssertExtends<B, A>,
      utils.AssertTrue<utils.IsEqual<A, B>>,
    ]
  >
})

test('union to intersection should merge unions', () => {
  type A = utils.UnionToIntersection<
    | {
        name: string
      }
    | {
        age: number
      }
  >
  type B = {
    name: string
    age: number
  }
  type _assertion = utils.AssertAll<
    [
      //
      utils.AssertExtends<A, B>,
      utils.AssertExtends<B, A>,
      utils.AssertTrue<utils.IsEqual<A, B>>,
    ]
  >
})

test('stricten record should remove string index signature', () => {
  type A = utils.ToSealedRecord<{
    name: string
    age: number
    [key: string]: any
  }>
  type B = {
    name: string
    age: number
  }
  type _assertion = utils.AssertAll<
    [
      //
      utils.AssertExtends<A, B>,
      utils.AssertExtends<B, A>,
      utils.AssertTrue<utils.IsEqual<A, B>>,
    ]
  >
})

test('default should return value if defined', () => {
  type A = utils.Default<'foo', 'default'>
  type B = 'foo'
  type _assertion = utils.AssertAll<
    [
      //
      utils.AssertExtends<A, B>,
      utils.AssertExtends<B, A>,
      utils.AssertTrue<utils.IsEqual<A, B>>,
    ]
  >
})

test('default should return default value if undefined', () => {
  type A = utils.Default<undefined, 'default'>
  type B = 'default'
  type _assertion = utils.AssertAll<
    [
      //
      utils.AssertExtends<A, B>,
      utils.AssertExtends<B, A>,
      utils.AssertTrue<utils.IsEqual<A, B>>,
    ]
  >
})

test('deep partial should make all properties optional', () => {
  type Actual = utils.DeepPartial<{
    name: string
    age: number
    address: readonly {
      street: string
      city: string
    }[]
    data: Promise<Buffer>
  }>
  type Expected = {
    name?: string
    age?: number
    address?: readonly {
      street?: string
      city?: string
    }[]
    data?: Promise<Buffer>
  }
  type _assertion = utils.AssertAll<
    [
      //
      utils.AssertExtends<Actual, Expected>,
      utils.AssertExtends<Expected, Actual>,
      utils.AssertTrue<utils.IsEqual<Actual, Expected>>,
    ]
  >
})

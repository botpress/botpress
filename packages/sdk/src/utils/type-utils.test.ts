import { test } from 'vitest'
import * as utils from './type-utils'

test('SafeCast should not cast if T extends U', () => {
  type A = utils.SafeCast<'foo', string>
  type B = 'foo'
  type _assertion = utils.AssertAll<
    [
      //
      utils.AssertExtends<A, B>,
      utils.AssertExtends<B, A>,
      utils.AssertTrue<utils.IsEqual<A, B>>
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
      utils.AssertTrue<utils.IsEqual<A, B>>
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
      utils.AssertTrue<utils.IsEqual<A, B>>
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
      utils.AssertTrue<utils.IsEqual<A, B>>
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
      utils.AssertTrue<utils.IsEqual<A, B>>
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
      utils.AssertTrue<utils.IsEqual<A, B>>
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
      utils.AssertTrue<utils.IsEqual<A, B>>
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
      utils.AssertTrue<utils.IsEqual<A, B>>
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
      utils.AssertTrue<utils.IsEqual<A, B>>
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
      utils.AssertTrue<utils.IsEqual<Actual, Expected>>
    ]
  >
})

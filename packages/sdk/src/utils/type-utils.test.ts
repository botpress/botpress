import { test } from 'vitest'
import * as types from './type-utils'

test('join should concatenate strings', () => {
  type A = types.Join<['a', 'b', 'c']>
  type B = 'abc'
  type _assertion = types.AssertAll<
    [
      //
      types.AssertExtends<A, B>,
      types.AssertExtends<B, A>
    ]
  >
})

test('split should split strings', () => {
  type A = types.Split<'a.b.c', '.'>
  type B = ['a', 'b', 'c']
  type _assertion = types.AssertAll<
    [
      //
      types.AssertExtends<A, B>,
      types.AssertExtends<B, A>
    ]
  >
})

test('union to intersection should merge unions', () => {
  type A = types.UnionToIntersection<
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
  type _assertion = types.AssertAll<
    [
      //
      types.AssertExtends<A, B>,
      types.AssertExtends<B, A>
    ]
  >
})

test('stricten record should remove string index signature', () => {
  type A = types.StrictenRecord<{
    name: string
    age: number
    [key: string]: any
  }>
  type B = {
    name: string
    age: number
  }
  type _assertion = types.AssertAll<
    [
      //
      types.AssertExtends<A, B>,
      types.AssertExtends<B, A>
    ]
  >
})

test('default should return value if defined', () => {
  type A = types.Default<'foo', 'default'>
  type B = 'foo'
  type _assertion = types.AssertAll<
    [
      //
      types.AssertExtends<A, B>,
      types.AssertExtends<B, A>
    ]
  >
})

test('default should return default value if undefined', () => {
  type A = types.Default<undefined, 'default'>
  type B = 'default'
  type _assertion = types.AssertAll<
    [
      //
      types.AssertExtends<A, B>,
      types.AssertExtends<B, A>
    ]
  >
})

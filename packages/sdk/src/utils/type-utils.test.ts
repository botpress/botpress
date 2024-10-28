import { test } from 'vitest'
import * as utils from './type-utils'

test('join should concatenate strings', () => {
  type A = utils.Join<['a', 'b', 'c']>
  type B = 'abc'
  type _assertion = utils.AssertAll<
    [
      //
      utils.AssertExtends<A, B>,
      utils.AssertExtends<B, A>
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
      utils.AssertExtends<B, A>
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
      utils.AssertExtends<B, A>
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
      utils.AssertExtends<B, A>
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
      utils.AssertExtends<B, A>
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
      utils.AssertExtends<B, A>
    ]
  >
})

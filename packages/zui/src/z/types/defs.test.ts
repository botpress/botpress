import { test } from 'vitest'
import { ZodNativeSchema } from '..'
import * as z from '../index'
import { util } from './utils'

test('ZodNativeSchema can be discriminated by typeName', () => {
  const s = z.string() as ZodNativeSchema
  if (s.typeName === 'ZodString') {
    s satisfies z.ZodString
  } else if (s.typeName === 'ZodNumber') {
    s satisfies z.ZodNumber
  } else if (s.typeName === 'ZodNaN') {
    s satisfies z.ZodNaN
  } else if (s.typeName === 'ZodBigInt') {
    s satisfies z.ZodBigInt
  } else if (s.typeName === 'ZodBoolean') {
    s satisfies z.ZodBoolean
  } else if (s.typeName === 'ZodDate') {
    s satisfies z.ZodDate
  } else if (s.typeName === 'ZodUndefined') {
    s satisfies z.ZodUndefined
  } else if (s.typeName === 'ZodNull') {
    s satisfies z.ZodNull
  } else if (s.typeName === 'ZodAny') {
    s satisfies z.ZodAny
  } else if (s.typeName === 'ZodUnknown') {
    s satisfies z.ZodUnknown
  } else if (s.typeName === 'ZodNever') {
    s satisfies z.ZodNever
  } else if (s.typeName === 'ZodVoid') {
    s satisfies z.ZodVoid
  } else if (s.typeName === 'ZodArray') {
    s satisfies z.ZodArray
  } else if (s.typeName === 'ZodObject') {
    s satisfies z.ZodObject
  } else if (s.typeName === 'ZodUnion') {
    s satisfies z.ZodUnion
  } else if (s.typeName === 'ZodDiscriminatedUnion') {
    s satisfies z.ZodDiscriminatedUnion
  } else if (s.typeName === 'ZodIntersection') {
    s satisfies z.ZodIntersection
  } else if (s.typeName === 'ZodTuple') {
    s satisfies z.ZodTuple
  } else if (s.typeName === 'ZodRecord') {
    s satisfies z.ZodRecord
  } else if (s.typeName === 'ZodMap') {
    s satisfies z.ZodMap
  } else if (s.typeName === 'ZodSet') {
    s satisfies z.ZodSet
  } else if (s.typeName === 'ZodFunction') {
    s satisfies z.ZodFunction
  } else if (s.typeName === 'ZodLazy') {
    s satisfies z.ZodLazy
  } else if (s.typeName === 'ZodLiteral') {
    s satisfies z.ZodLiteral
  } else if (s.typeName === 'ZodEnum') {
    s satisfies z.ZodEnum
  } else if (s.typeName === 'ZodEffects') {
    s satisfies z.ZodEffects
  } else if (s.typeName === 'ZodNativeEnum') {
    s satisfies z.ZodNativeEnum
  } else if (s.typeName === 'ZodOptional') {
    s satisfies z.ZodOptional
  } else if (s.typeName === 'ZodNullable') {
    s satisfies z.ZodNullable
  } else if (s.typeName === 'ZodDefault') {
    s satisfies z.ZodDefault
  } else if (s.typeName === 'ZodCatch') {
    s satisfies z.ZodCatch
  } else if (s.typeName === 'ZodPromise') {
    s satisfies z.ZodPromise
  } else if (s.typeName === 'ZodBranded') {
    s satisfies z.ZodBranded
  } else if (s.typeName === 'ZodPipeline') {
    s satisfies z.ZodPipeline
  } else if (s.typeName === 'ZodReadonly') {
    s satisfies z.ZodReadonly
  } else if (s.typeName === 'ZodSymbol') {
    s satisfies z.ZodSymbol
  } else if (s.typeName === 'ZodRef') {
    s satisfies z.ZodRef
  } else {
    util.assertNever(s)
  }
})

test('Identify missing [ZodFirstPartySchemaTypes]', () => {
  type ZodFirstPartySchemaForType<T extends z.ZodNativeSchemaType> = ZodNativeSchema extends infer Schema
    ? Schema extends { _def: { typeName: T } }
      ? Schema
      : never
    : never
  type ZodMappedTypes = {
    [key in z.ZodNativeSchemaType]: ZodFirstPartySchemaForType<key>
  }
  type ZodFirstPartySchemaTypesMissingFromUnion = keyof {
    [key in keyof ZodMappedTypes as ZodMappedTypes[key] extends { _def: never } ? key : never]: unknown
  }

  util.assertEqual<ZodFirstPartySchemaTypesMissingFromUnion, never>(true)
})

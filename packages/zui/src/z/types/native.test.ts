import { test } from 'vitest'
import { ZodFirstPartySchemaTypes, ZodFirstPartyTypeKind } from './native'
import * as z from '../index'
import { util } from './utils'

test('first party switch', () => {
  const myType = z.string() as z.ZodNativeSchema

  switch (myType.typeName) {
    case z.ZodFirstPartyTypeKind.ZodString:
      myType satisfies z.ZodString
      break
    case z.ZodFirstPartyTypeKind.ZodNumber:
      myType satisfies z.ZodNumber
      break
    case z.ZodFirstPartyTypeKind.ZodNaN:
      myType satisfies z.ZodNaN
      break
    case z.ZodFirstPartyTypeKind.ZodBigInt:
      myType satisfies z.ZodBigInt
      break
    case z.ZodFirstPartyTypeKind.ZodBoolean:
      myType satisfies z.ZodBoolean
      break
    case z.ZodFirstPartyTypeKind.ZodDate:
      myType satisfies z.ZodDate
      break
    case z.ZodFirstPartyTypeKind.ZodUndefined:
      myType satisfies z.ZodUndefined
      break
    case z.ZodFirstPartyTypeKind.ZodNull:
      myType satisfies z.ZodNull
      break
    case z.ZodFirstPartyTypeKind.ZodAny:
      myType satisfies z.ZodAny
      break
    case z.ZodFirstPartyTypeKind.ZodUnknown:
      myType satisfies z.ZodUnknown
      break
    case z.ZodFirstPartyTypeKind.ZodNever:
      myType satisfies z.ZodNever
      break
    case z.ZodFirstPartyTypeKind.ZodVoid:
      myType satisfies z.ZodVoid
      break
    case z.ZodFirstPartyTypeKind.ZodArray:
      myType satisfies z.ZodArray
      break
    case z.ZodFirstPartyTypeKind.ZodObject:
      myType satisfies z.ZodObject
      break
    case z.ZodFirstPartyTypeKind.ZodUnion:
      myType satisfies z.ZodUnion
      break
    case z.ZodFirstPartyTypeKind.ZodDiscriminatedUnion:
      myType satisfies z.ZodDiscriminatedUnion
      break
    case z.ZodFirstPartyTypeKind.ZodIntersection:
      myType satisfies z.ZodIntersection
      break
    case z.ZodFirstPartyTypeKind.ZodTuple:
      myType satisfies z.ZodTuple
      break
    case z.ZodFirstPartyTypeKind.ZodRecord:
      myType satisfies z.ZodRecord
      break
    case z.ZodFirstPartyTypeKind.ZodRef:
      myType satisfies z.ZodRef
      break
    case z.ZodFirstPartyTypeKind.ZodMap:
      myType satisfies z.ZodMap
      break
    case z.ZodFirstPartyTypeKind.ZodSet:
      myType satisfies z.ZodSet
      break
    case z.ZodFirstPartyTypeKind.ZodFunction:
      myType satisfies z.ZodFunction
      break
    case z.ZodFirstPartyTypeKind.ZodLazy:
      myType satisfies z.ZodLazy
      break
    case z.ZodFirstPartyTypeKind.ZodLiteral:
      myType satisfies z.ZodLiteral
      break
    case z.ZodFirstPartyTypeKind.ZodEnum:
      myType satisfies z.ZodEnum
      break
    case z.ZodFirstPartyTypeKind.ZodEffects:
      myType satisfies z.ZodEffects
      break
    case z.ZodFirstPartyTypeKind.ZodNativeEnum:
      myType satisfies z.ZodNativeEnum
      break
    case z.ZodFirstPartyTypeKind.ZodOptional:
      myType satisfies z.ZodOptional
      break
    case z.ZodFirstPartyTypeKind.ZodNullable:
      myType satisfies z.ZodNullable
      break
    case z.ZodFirstPartyTypeKind.ZodDefault:
      myType satisfies z.ZodDefault
      break
    case z.ZodFirstPartyTypeKind.ZodCatch:
      myType satisfies z.ZodCatch
      break
    case z.ZodFirstPartyTypeKind.ZodPromise:
      myType satisfies z.ZodPromise
      break
    case z.ZodFirstPartyTypeKind.ZodBranded:
      myType satisfies z.ZodBranded
      break
    case z.ZodFirstPartyTypeKind.ZodPipeline:
      myType satisfies z.ZodPipeline
      break
    case z.ZodFirstPartyTypeKind.ZodSymbol:
      myType satisfies z.ZodSymbol
      break
    case z.ZodFirstPartyTypeKind.ZodReadonly:
      myType satisfies z.ZodReadonly
      break
    default:
      util.assertNever(myType)
  }
})

test('Identify missing [ZodFirstPartySchemaTypes]', () => {
  type ZodFirstPartySchemaForType<T extends ZodFirstPartyTypeKind> = ZodFirstPartySchemaTypes extends infer Schema
    ? Schema extends { _def: { typeName: T } }
      ? Schema
      : never
    : never
  type ZodMappedTypes = {
    [key in ZodFirstPartyTypeKind]: ZodFirstPartySchemaForType<key>
  }
  type ZodFirstPartySchemaTypesMissingFromUnion = keyof {
    [key in keyof ZodMappedTypes as ZodMappedTypes[key] extends { _def: never } ? key : never]: unknown
  }

  util.assertEqual<ZodFirstPartySchemaTypesMissingFromUnion, never>(true)
})

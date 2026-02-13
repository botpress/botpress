import {
  ZodAny,
  ZodArray,
  ZodBigInt,
  ZodBoolean,
  ZodBranded,
  ZodCatch,
  ZodDate,
  ZodDefault,
  ZodDiscriminatedUnion,
  ZodEffects,
  ZodEnum,
  ZodFunction,
  ZodIntersection,
  ZodLazy,
  ZodLiteral,
  ZodMap,
  ZodNaN,
  ZodNativeEnum,
  ZodNever,
  ZodNull,
  ZodNullable,
  ZodNumber,
  ZodObject,
  ZodOptional,
  ZodPipeline,
  ZodPromise,
  ZodReadonly,
  ZodRecord,
  ZodRef,
  ZodSet,
  ZodString,
  ZodSymbol,
  ZodTuple,
  ZodUndefined,
  ZodUnion,
  ZodUnknown,
  ZodVoid,
} from '../types'

export type ZodNativeSchema =
  | ZodString
  | ZodNumber
  | ZodNaN
  | ZodBigInt
  | ZodBoolean
  | ZodDate
  | ZodUndefined
  | ZodNull
  | ZodAny
  | ZodUnknown
  | ZodNever
  | ZodVoid
  | ZodArray
  | ZodObject
  | ZodUnion
  | ZodDiscriminatedUnion
  | ZodIntersection
  | ZodTuple
  | ZodRecord
  | ZodMap
  | ZodSet
  | ZodFunction
  | ZodLazy
  | ZodLiteral
  | ZodEnum
  | ZodEffects
  | ZodNativeEnum
  | ZodOptional
  | ZodNullable
  | ZodDefault
  | ZodCatch
  | ZodPromise
  | ZodBranded
  | ZodPipeline
  | ZodReadonly
  | ZodSymbol
  | ZodRef

export type ZodNativeSchemaDef = ZodNativeSchema['_def']

export type ZodNativeSchemaType = ZodNativeSchemaDef['typeName']

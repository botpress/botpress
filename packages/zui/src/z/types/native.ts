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
} from './index'

/**
 * @deprecated - use ZodNativeSchema instead
 */
export type ZodFirstPartySchemaTypes = ZodNativeSchema
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

/**
 * @deprecated - use ZodNativeSchemaDef instead
 */
export type ZodDef = ZodNativeSchemaDef
export type ZodNativeSchemaDef = ZodNativeSchema['_def']

/**
 * @deprecated - use ZodNativeSchemaType instead
 */
export type ZodFirstPartyTypeKind = ZodNativeSchemaType
export type ZodNativeSchemaType = ZodNativeSchemaDef['typeName']

/**
 * @deprecated - use ZodNativeSchemaType instead
 */
export const ZodFirstPartyTypeKind = {
  ZodString: 'ZodString',
  ZodNumber: 'ZodNumber',
  ZodNaN: 'ZodNaN',
  ZodBigInt: 'ZodBigInt',
  ZodBoolean: 'ZodBoolean',
  ZodDate: 'ZodDate',
  ZodSymbol: 'ZodSymbol',
  ZodUndefined: 'ZodUndefined',
  ZodNull: 'ZodNull',
  ZodAny: 'ZodAny',
  ZodUnknown: 'ZodUnknown',
  ZodNever: 'ZodNever',
  ZodVoid: 'ZodVoid',
  ZodArray: 'ZodArray',
  ZodObject: 'ZodObject',
  ZodUnion: 'ZodUnion',
  ZodDiscriminatedUnion: 'ZodDiscriminatedUnion',
  ZodIntersection: 'ZodIntersection',
  ZodTuple: 'ZodTuple',
  ZodRecord: 'ZodRecord',
  ZodRef: 'ZodRef',
  ZodMap: 'ZodMap',
  ZodSet: 'ZodSet',
  ZodFunction: 'ZodFunction',
  ZodLazy: 'ZodLazy',
  ZodLiteral: 'ZodLiteral',
  ZodEnum: 'ZodEnum',
  ZodEffects: 'ZodEffects',
  ZodNativeEnum: 'ZodNativeEnum',
  ZodOptional: 'ZodOptional',
  ZodNullable: 'ZodNullable',
  ZodDefault: 'ZodDefault',
  ZodCatch: 'ZodCatch',
  ZodPromise: 'ZodPromise',
  ZodBranded: 'ZodBranded',
  ZodPipeline: 'ZodPipeline',
  ZodReadonly: 'ZodReadonly',
} satisfies {
  [K in ZodNativeSchemaType]: K
}

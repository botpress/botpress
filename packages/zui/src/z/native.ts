import {
  IZodAny,
  IZodArray,
  IZodBigInt,
  IZodBoolean,
  IZodBranded,
  IZodCatch,
  IZodDate,
  IZodDefault,
  IZodDiscriminatedUnion,
  IZodEnum,
  IZodFunction,
  IZodIntersection,
  IZodLazy,
  IZodLiteral,
  IZodMap,
  IZodNaN,
  IZodNativeEnum,
  IZodNever,
  IZodNull,
  IZodNullable,
  IZodNumber,
  IZodObject,
  IZodOptional,
  IZodPipeline,
  IZodPromise,
  IZodReadonly,
  IZodRecord,
  IZodRef,
  IZodSet,
  IZodString,
  IZodSymbol,
  IZodEffects,
  IZodTuple,
  IZodUndefined,
  IZodUnion,
  IZodUnknown,
  IZodVoid,
} from './typings'

/**
 * @deprecated - use ZodNativeSchema instead
 */
export type ZodFirstPartySchemaTypes = ZodNativeType
export type ZodNativeType =
  | IZodAny
  | IZodArray
  | IZodBigInt
  | IZodBoolean
  | IZodBranded
  | IZodCatch
  | IZodDate
  | IZodDefault
  | IZodDiscriminatedUnion
  | IZodEnum
  | IZodFunction
  | IZodIntersection
  | IZodLazy
  | IZodLiteral
  | IZodMap
  | IZodNaN
  | IZodNativeEnum
  | IZodNever
  | IZodNull
  | IZodNullable
  | IZodNumber
  | IZodObject
  | IZodOptional
  | IZodPipeline
  | IZodPromise
  | IZodReadonly
  | IZodRecord
  | IZodRef
  | IZodSet
  | IZodString
  | IZodSymbol
  | IZodEffects
  | IZodTuple
  | IZodUndefined
  | IZodUnion
  | IZodUnknown
  | IZodVoid

export type ZodNativeTypeDef = ZodNativeType['_def']

/**
 * @deprecated - use ZodNativeSchemaType instead
 */
export type ZodFirstPartyTypeKind = ZodNativeTypeName
export type ZodNativeTypeName = ZodNativeTypeDef['typeName']

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
  [K in ZodNativeTypeName]: K
}

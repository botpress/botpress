import { ZodAny } from './any'
import { ZodArray } from './array'
import { ZodBigInt } from './bigint'
import { ZodBoolean } from './boolean'
import { ZodBranded } from './branded'
import { ZodCatch } from './catch'
import { ZodDate } from './date'
import { ZodDefault } from './default'
import { ZodDiscriminatedUnion } from './discriminatedUnion'
import { ZodEnum } from './enum'
import { ZodFunction } from './function'
import { ZodIntersection } from './intersection'
import { ZodLazy } from './lazy'
import { ZodLiteral } from './literal'
import { ZodMap } from './map'
import { ZodNaN } from './nan'
import { ZodNativeEnum } from './nativeEnum'
import { ZodNever } from './never'
import { ZodNull } from './null'
import { ZodNullable } from './nullable'
import { ZodNumber } from './number'
import { ZodObject } from './object'
import { ZodOptional } from './optional'
import { ZodPipeline } from './pipeline'
import { ZodPromise } from './promise'
import { ZodReadonly } from './readonly'
import { ZodRecord } from './record'
import { ZodRef } from './ref'
import { ZodSet } from './set'
import { ZodString } from './string'
import { ZodSymbol } from './symbol'
import { ZodEffects } from './transformer'
import { ZodTuple } from './tuple'
import { ZodUndefined } from './undefined'
import { ZodUnion } from './union'
import { ZodUnknown } from './unknown'
import { ZodVoid } from './void'

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

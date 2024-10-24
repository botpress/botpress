import {
  custom,
  CustomParams,
  INVALID,
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
  ZodType,
  ZodUndefined,
  ZodUnion,
  ZodUnknown,
  ZodVoid,
} from './types'

export { ZodType as Schema, ZodType as ZodSchema }

export const late = {
  object: ZodObject.lazycreate,
}

export type ZodFirstPartySchemaTypes =
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

// requires TS 4.4+
abstract class Class {
  constructor(..._: any[]) {}
}
const instanceOfType = <T extends typeof Class>(
  // const instanceOfType = <T extends new (...args: any[]) => any>(
  cls: T,
  params: CustomParams = {
    message: `Input not instance of ${cls.name}`,
  },
) => custom<InstanceType<T>>((data) => data instanceof cls, params)

const stringType = ZodString.create
const numberType = ZodNumber.create
const nanType = ZodNaN.create
const bigIntType = ZodBigInt.create
const booleanType = ZodBoolean.create
const dateType = ZodDate.create
const symbolType = ZodSymbol.create
const undefinedType = ZodUndefined.create
const nullType = ZodNull.create
const anyType = ZodAny.create
const unknownType = ZodUnknown.create
const neverType = ZodNever.create
const voidType = ZodVoid.create
const arrayType = ZodArray.create
const objectType = ZodObject.create
const strictObjectType = ZodObject.strictCreate
const unionType = ZodUnion.create
const discriminatedUnionType = ZodDiscriminatedUnion.create
const intersectionType = ZodIntersection.create
const tupleType = ZodTuple.create
const recordType = ZodRecord.create
const refType = ZodRef.create
const readonlyType = ZodReadonly.create
const mapType = ZodMap.create
const setType = ZodSet.create
const functionType = ZodFunction.create
const lazyType = ZodLazy.create
const literalType = ZodLiteral.create
const enumType = ZodEnum.create
const nativeEnumType = ZodNativeEnum.create
const promiseType = ZodPromise.create
const effectsType = ZodEffects.create
const optionalType = ZodOptional.create
const nullableType = ZodNullable.create
const defaultType = ZodDefault.create
const preprocessType = ZodEffects.createWithPreprocess
const pipelineType = ZodPipeline.create
const ostring = () => stringType().optional()
const onumber = () => numberType().optional()
const oboolean = () => booleanType().optional()
const fromJsonSchema = ZodType.fromJsonSchema
const fromObject = ZodType.fromObject

export const coerce = {
  string: ((arg) => ZodString.create({ ...arg, coerce: true })) as (typeof ZodString)['create'],
  number: ((arg) => ZodNumber.create({ ...arg, coerce: true })) as (typeof ZodNumber)['create'],
  boolean: ((arg) =>
    ZodBoolean.create({
      ...arg,
      coerce: true,
    })) as (typeof ZodBoolean)['create'],
  bigint: ((arg) => ZodBigInt.create({ ...arg, coerce: true })) as (typeof ZodBigInt)['create'],
  date: ((arg) => ZodDate.create({ ...arg, coerce: true })) as (typeof ZodDate)['create'],
}

export {
  anyType as any,
  arrayType as array,
  bigIntType as bigint,
  booleanType as boolean,
  dateType as date,
  defaultType as default,
  discriminatedUnionType as discriminatedUnion,
  effectsType as effect,
  enumType as enum,
  functionType as function,
  instanceOfType as instanceof,
  intersectionType as intersection,
  lazyType as lazy,
  literalType as literal,
  mapType as map,
  nanType as nan,
  nativeEnumType as nativeEnum,
  neverType as never,
  nullType as null,
  nullableType as nullable,
  numberType as number,
  objectType as object,
  oboolean,
  onumber,
  optionalType as optional,
  ostring,
  pipelineType as pipeline,
  preprocessType as preprocess,
  promiseType as promise,
  recordType as record,
  refType as ref,
  readonlyType as readonly,
  setType as set,
  strictObjectType as strictObject,
  stringType as string,
  symbolType as symbol,
  effectsType as transformer,
  tupleType as tuple,
  undefinedType as undefined,
  unionType as union,
  unknownType as unknown,
  voidType as void,
  fromJsonSchema,
  fromObject,
}

export const NEVER = INVALID as never

export * from './types'
export * from './types/error'
export * from './types/utils'
export * from './types/utils/parseUtil'
export * from './types/utils/typeAliases'
export * from './extensions'

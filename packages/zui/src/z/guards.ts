import { ZodError } from './error'
import { ZodBaseTypeImpl } from './types'
import type {
  IZodError,
  IZodType,
  ZodNativeType,
  ZodNativeTypeName,
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

const _isError = (value: unknown): value is Error => value instanceof Error
const _isObject = (value: unknown): value is object => typeof value === 'object' && value !== null

type _GuardName<S extends ZodNativeTypeName> = S extends `Zod${infer R}` ? `zui${R}` : never
type _Guards = {
  [G in ZodNativeTypeName as _GuardName<G>]: (value: IZodType) => value is Extract<ZodNativeType, { typeName: G }>
} & {
  zuiError: (thrown: unknown) => thrown is IZodError
  zuiType: (value: unknown) => value is ZodNativeType
}

export const is: _Guards = {
  zuiError: (thrown: unknown): thrown is IZodError =>
    thrown instanceof ZodError || (_isError(thrown) && '__type__' in thrown && thrown.__type__ === 'ZuiError'),
  zuiType: (value: unknown): value is ZodNativeType =>
    value instanceof ZodBaseTypeImpl || (_isObject(value) && '__type__' in value && value.__type__ === 'ZuiType'),

  zuiAny: (s: IZodType): s is IZodAny => s.typeName === 'ZodAny',
  zuiArray: (s: IZodType): s is IZodArray => s.typeName === 'ZodArray',
  zuiBigInt: (s: IZodType): s is IZodBigInt => s.typeName === 'ZodBigInt',
  zuiBoolean: (s: IZodType): s is IZodBoolean => s.typeName === 'ZodBoolean',
  zuiBranded: (s: IZodType): s is IZodBranded => s.typeName === 'ZodBranded',
  zuiCatch: (s: IZodType): s is IZodCatch => s.typeName === 'ZodCatch',
  zuiDate: (s: IZodType): s is IZodDate => s.typeName === 'ZodDate',
  zuiDefault: (s: IZodType): s is IZodDefault => s.typeName === 'ZodDefault',
  zuiDiscriminatedUnion: (s: IZodType): s is IZodDiscriminatedUnion => s.typeName === 'ZodDiscriminatedUnion',
  zuiEnum: (s: IZodType): s is IZodEnum => s.typeName === 'ZodEnum',
  zuiFunction: (s: IZodType): s is IZodFunction => s.typeName === 'ZodFunction',
  zuiIntersection: (s: IZodType): s is IZodIntersection => s.typeName === 'ZodIntersection',
  zuiLazy: (s: IZodType): s is IZodLazy => s.typeName === 'ZodLazy',
  zuiLiteral: (s: IZodType): s is IZodLiteral => s.typeName === 'ZodLiteral',
  zuiMap: (s: IZodType): s is IZodMap => s.typeName === 'ZodMap',
  zuiNaN: (s: IZodType): s is IZodNaN => s.typeName === 'ZodNaN',
  zuiNativeEnum: (s: IZodType): s is IZodNativeEnum => s.typeName === 'ZodNativeEnum',
  zuiNever: (s: IZodType): s is IZodNever => s.typeName === 'ZodNever',
  zuiNull: (s: IZodType): s is IZodNull => s.typeName === 'ZodNull',
  zuiNullable: (s: IZodType): s is IZodNullable => s.typeName === 'ZodNullable',
  zuiNumber: (s: IZodType): s is IZodNumber => s.typeName === 'ZodNumber',
  zuiObject: (s: IZodType): s is IZodObject => s.typeName === 'ZodObject',
  zuiOptional: (s: IZodType): s is IZodOptional => s.typeName === 'ZodOptional',
  zuiPipeline: (s: IZodType): s is IZodPipeline => s.typeName === 'ZodPipeline',
  zuiPromise: (s: IZodType): s is IZodPromise => s.typeName === 'ZodPromise',
  zuiReadonly: (s: IZodType): s is IZodReadonly => s.typeName === 'ZodReadonly',
  zuiRecord: (s: IZodType): s is IZodRecord => s.typeName === 'ZodRecord',
  zuiRef: (s: IZodType): s is IZodRef => s.typeName === 'ZodRef',
  zuiSet: (s: IZodType): s is IZodSet => s.typeName === 'ZodSet',
  zuiString: (s: IZodType): s is IZodString => s.typeName === 'ZodString',
  zuiSymbol: (s: IZodType): s is IZodSymbol => s.typeName === 'ZodSymbol',
  zuiEffects: (s: IZodType): s is IZodEffects => s.typeName === 'ZodEffects',
  zuiTuple: (s: IZodType): s is IZodTuple => s.typeName === 'ZodTuple',
  zuiUndefined: (s: IZodType): s is IZodUndefined => s.typeName === 'ZodUndefined',
  zuiUnion: (s: IZodType): s is IZodUnion => s.typeName === 'ZodUnion',
  zuiUnknown: (s: IZodType): s is IZodUnknown => s.typeName === 'ZodUnknown',
  zuiVoid: (s: IZodType): s is IZodVoid => s.typeName === 'ZodVoid',
} satisfies {
  [G in ZodNativeTypeName as _GuardName<G>]: (value: IZodType) => value is Extract<ZodNativeType, { typeName: G }>
} & {
  zuiError: (thrown: unknown) => thrown is IZodError
  zuiType: (value: unknown) => value is ZodNativeType
}

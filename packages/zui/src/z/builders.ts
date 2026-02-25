import {
  ZodAnyImpl,
  ZodArrayImpl,
  ZodBigIntImpl,
  ZodBooleanImpl,
  ZodBrandedImpl,
  ZodCatchImpl,
  ZodDateImpl,
  ZodDefaultImpl,
  ZodDiscriminatedUnionImpl,
  ZodEffectsImpl,
  ZodEnumImpl,
  ZodFunctionImpl,
  ZodIntersectionImpl,
  ZodLazyImpl,
  ZodLiteralImpl,
  ZodMapImpl,
  ZodNaNImpl,
  ZodNativeEnumImpl,
  ZodNeverImpl,
  ZodNullImpl,
  ZodNullableImpl,
  ZodNumberImpl,
  ZodObjectImpl,
  ZodOptionalImpl,
  ZodPipelineImpl,
  ZodPromiseImpl,
  ZodReadonlyImpl,
  ZodRecordImpl,
  ZodRefImpl,
  ZodSetImpl,
  ZodStringImpl,
  ZodSymbolImpl,
  ZodTupleImpl,
  ZodUndefinedImpl,
  ZodUnionImpl,
  ZodUnknownImpl,
  ZodVoidImpl,
} from './types'

import { ZodBaseTypeImpl } from './types/basetype'
import { setBuilders } from './internal-builders'
import { zuiKey } from './consts'

import type {
  IZodRecord,
  IZodTuple,
  IZodType,
  KeySchema,
  RawCreateParams,
  ZodErrorMap,
  ZuiExtensionObject,
  ZodBuilders,
} from './typings'

type _ProcessedCreateParams = {
  errorMap?: ZodErrorMap
  description?: string
  [zuiKey]?: ZuiExtensionObject
}

const _processCreateParams = (
  params: RawCreateParams & ({ supportsExtensions?: 'secret'[] } | undefined)
): _ProcessedCreateParams => {
  if (!params) return {}

  const {
    errorMap,
    invalid_type_error,
    required_error,
    description,
    supportsExtensions,
    [zuiKey]: zuiExtensions,
  } = params as any

  if (errorMap && (invalid_type_error || required_error)) {
    throw new Error('Can\'t use "invalid_type_error" or "required_error" in conjunction with custom error map.')
  }

  const filteredZuiExtensions = (
    zuiExtensions
      ? Object.fromEntries(
          Object.entries(zuiExtensions).filter(([key]) => key !== 'secret' || supportsExtensions?.includes('secret'))
        )
      : undefined
  ) as ZuiExtensionObject | undefined

  if (errorMap) return { errorMap, description, [zuiKey]: filteredZuiExtensions }

  const customMap: ZodErrorMap = (iss, ctx) => {
    if (iss.code !== 'invalid_type') return { message: ctx.defaultError }
    if (typeof ctx.data === 'undefined') {
      return { message: required_error ?? ctx.defaultError }
    }
    return { message: invalid_type_error ?? ctx.defaultError }
  }
  return { errorMap: customMap, description, [zuiKey]: filteredZuiExtensions }
}

export const customType: ZodBuilders['custom'] = (check?, params = {}, fatal?) => {
  if (check) {
    return anyType().superRefine((data, ctx) => {
      if (!check(data)) {
        const p =
          typeof params === 'function' ? params(data) : typeof params === 'string' ? { message: params } : params
        const _fatal = p.fatal ?? fatal ?? true
        const p2 = typeof p === 'string' ? { message: p } : p
        ctx.addIssue({ code: 'custom', ...p2, fatal: _fatal })
      }
    })
  }
  return anyType()
}

export const instanceOfType: ZodBuilders['instanceof'] = (
  cls,
  params = {
    message: `Input not instance of ${cls.name}`,
  }
) => customType((data) => data instanceof cls, params)

export const anyType: ZodBuilders['any'] = (params) =>
  new ZodAnyImpl({ typeName: 'ZodAny', ..._processCreateParams(params) })

export const unknownType: ZodBuilders['unknown'] = (params) =>
  new ZodUnknownImpl({ typeName: 'ZodUnknown', ..._processCreateParams(params) })

export const neverType: ZodBuilders['never'] = (params) =>
  new ZodNeverImpl({ typeName: 'ZodNever', ..._processCreateParams(params) })

export const voidType: ZodBuilders['void'] = (params) =>
  new ZodVoidImpl({ typeName: 'ZodVoid', ..._processCreateParams(params) })

export const nullType: ZodBuilders['null'] = (params) =>
  new ZodNullImpl({ typeName: 'ZodNull', ..._processCreateParams(params) })

export const undefinedType: ZodBuilders['undefined'] = (params) =>
  new ZodUndefinedImpl({ typeName: 'ZodUndefined', ..._processCreateParams(params) })

export const symbolType: ZodBuilders['symbol'] = (params) =>
  new ZodSymbolImpl({ typeName: 'ZodSymbol', ..._processCreateParams(params) })

export const nanType: ZodBuilders['nan'] = (params) =>
  new ZodNaNImpl({ typeName: 'ZodNaN', ..._processCreateParams(params) })

export const stringType: ZodBuilders['string'] = (params) =>
  new ZodStringImpl({
    checks: [],
    typeName: 'ZodString',
    coerce: params?.coerce ?? false,
    ..._processCreateParams({ ...params, supportsExtensions: ['secret'] }),
  })

export const numberType: ZodBuilders['number'] = (params) =>
  new ZodNumberImpl({
    checks: [],
    typeName: 'ZodNumber',
    coerce: params?.coerce || false,
    ..._processCreateParams(params),
  })

export const booleanType: ZodBuilders['boolean'] = (params) =>
  new ZodBooleanImpl({
    typeName: 'ZodBoolean',
    coerce: params?.coerce || false,
    ..._processCreateParams(params),
  })

export const bigIntType: ZodBuilders['bigint'] = (params) =>
  new ZodBigIntImpl({
    checks: [],
    typeName: 'ZodBigInt',
    coerce: params?.coerce ?? false,
    ..._processCreateParams(params),
  })

export const dateType: ZodBuilders['date'] = (params) =>
  new ZodDateImpl({
    checks: [],
    coerce: params?.coerce || false,
    typeName: 'ZodDate',
    ..._processCreateParams(params),
  })

export const refType: ZodBuilders['ref'] = (uri) => new ZodRefImpl({ typeName: 'ZodRef', uri })

export const literalType: ZodBuilders['literal'] = (value, params) =>
  new ZodLiteralImpl({ value, typeName: 'ZodLiteral', ..._processCreateParams(params) })

export const enumType: ZodBuilders['enum'] = ((values: [string, ...string[]], params?: RawCreateParams) =>
  new ZodEnumImpl({ values, typeName: 'ZodEnum', ..._processCreateParams(params) })) as ZodBuilders['enum']

export const nativeEnumType: ZodBuilders['nativeEnum'] = (values, params) =>
  new ZodNativeEnumImpl({ values, typeName: 'ZodNativeEnum', ..._processCreateParams(params) })

export const arrayType: ZodBuilders['array'] = (schema, params) =>
  new ZodArrayImpl({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: 'ZodArray',
    ..._processCreateParams(params),
  })

export const objectType: ZodBuilders['object'] = (shape, params) =>
  new ZodObjectImpl({
    shape: () => shape,
    unknownKeys: 'strip',
    typeName: 'ZodObject',
    ..._processCreateParams(params),
  })

export const strictObjectType: ZodBuilders['strictObject'] = (shape, params) =>
  new ZodObjectImpl({
    shape: () => shape,
    unknownKeys: 'strict',
    typeName: 'ZodObject',
    ..._processCreateParams(params),
  })

export const unionType: ZodBuilders['union'] = (types, params) =>
  new ZodUnionImpl({ options: types, typeName: 'ZodUnion', ..._processCreateParams(params) })

export const discriminatedUnionType: ZodBuilders['discriminatedUnion'] = (discriminator, options, params) =>
  new ZodDiscriminatedUnionImpl({
    typeName: 'ZodDiscriminatedUnion',
    discriminator,
    options,
    ..._processCreateParams(params),
  })

export const intersectionType: ZodBuilders['intersection'] = (left, right, params) =>
  new ZodIntersectionImpl({ left, right, typeName: 'ZodIntersection', ..._processCreateParams(params) })

export const tupleType: ZodBuilders['tuple'] = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error('You must pass an array of schemas to z.tuple([ ... ])')
  }
  return new ZodTupleImpl({ items: schemas, typeName: 'ZodTuple', rest: null, ..._processCreateParams(params) })
}

export const recordType: ZodBuilders['record'] = (
  first: KeySchema | IZodType,
  second?: RawCreateParams | IZodType,
  third?: RawCreateParams
): IZodRecord<any, any> => {
  if (second instanceof ZodBaseTypeImpl) {
    return new ZodRecordImpl({
      keyType: first,
      valueType: second,
      typeName: 'ZodRecord',
      ..._processCreateParams(third),
    })
  }
  return new ZodRecordImpl({
    keyType: stringType(),
    valueType: first,
    typeName: 'ZodRecord',
    ..._processCreateParams(second),
  })
}

export const mapType: ZodBuilders['map'] = (keyType, valueType, params) =>
  new ZodMapImpl({ valueType, keyType, typeName: 'ZodMap', ..._processCreateParams(params) })

export const setType: ZodBuilders['set'] = (valueType, params) =>
  new ZodSetImpl({ valueType, minSize: null, maxSize: null, typeName: 'ZodSet', ..._processCreateParams(params) })

export const lazyType: ZodBuilders['lazy'] = (getter, params) =>
  new ZodLazyImpl({ getter, typeName: 'ZodLazy', ..._processCreateParams(params) })

export const promiseType: ZodBuilders['promise'] = (schema, params) =>
  new ZodPromiseImpl({ type: schema, typeName: 'ZodPromise', ..._processCreateParams(params) })

export const functionType: ZodBuilders['function'] = (
  args?: IZodTuple<any, any>,
  returns?: IZodType<any, any>,
  params?: RawCreateParams
) => {
  return new ZodFunctionImpl({
    args: args ? args : tupleType([]).rest(unknownType()),
    returns: returns || unknownType(),
    typeName: 'ZodFunction',
    ..._processCreateParams(params),
  })
}

export const effectsType: ZodBuilders['effects'] = (schema, effect, params) =>
  new ZodEffectsImpl({ schema, typeName: 'ZodEffects', effect, ..._processCreateParams(params) })

export const preprocessType: ZodBuilders['preprocess'] = (preprocess, schema, params) =>
  new ZodEffectsImpl({
    schema,
    effect: { type: 'preprocess', transform: preprocess },
    typeName: 'ZodEffects',
    ..._processCreateParams(params),
  })

export const optionalType: ZodBuilders['optional'] = (type, params) =>
  new ZodOptionalImpl({ innerType: type, typeName: 'ZodOptional', ..._processCreateParams(params) })

export const nullableType: ZodBuilders['nullable'] = (type, params) =>
  new ZodNullableImpl({ innerType: type, typeName: 'ZodNullable', ..._processCreateParams(params) })

export const readonlyType: ZodBuilders['readonly'] = (type, params) =>
  new ZodReadonlyImpl({ innerType: type, typeName: 'ZodReadonly', ..._processCreateParams(params) })

export const defaultType: ZodBuilders['default'] = (type, value, params) =>
  new ZodDefaultImpl({
    innerType: type,
    typeName: 'ZodDefault',
    defaultValue: typeof value === 'function' ? value : () => value,
    ..._processCreateParams(params),
  })

export const catchType: ZodBuilders['catch'] = (type, catcher, params) =>
  new ZodCatchImpl({
    innerType: type,
    typeName: 'ZodCatch',
    catchValue: typeof catcher === 'function' ? catcher : () => catcher,
    ..._processCreateParams(params),
  })

export const pipelineType: ZodBuilders['pipeline'] = (a, b) =>
  new ZodPipelineImpl({ in: a, out: b, typeName: 'ZodPipeline' })

export const brandedType: ZodBuilders['branded'] = (type) =>
  new ZodBrandedImpl({
    typeName: 'ZodBranded',
    type,
    ..._processCreateParams({ supportsExtensions: ['secret'] }),
  })

setBuilders({
  any: anyType,
  array: arrayType,
  bigint: bigIntType,
  boolean: booleanType,
  branded: brandedType,
  catch: catchType,
  custom: customType,
  date: dateType,
  default: defaultType,
  discriminatedUnion: discriminatedUnionType,
  effects: effectsType,
  enum: enumType,
  function: functionType,
  instanceof: instanceOfType,
  intersection: intersectionType,
  lazy: lazyType,
  literal: literalType,
  map: mapType,
  nan: nanType,
  nativeEnum: nativeEnumType,
  never: neverType,
  null: nullType,
  nullable: nullableType,
  number: numberType,
  object: objectType,
  optional: optionalType,
  pipeline: pipelineType,
  preprocess: preprocessType,
  promise: promiseType,
  record: recordType,
  ref: refType,
  readonly: readonlyType,
  set: setType,
  strictObject: strictObjectType,
  string: stringType,
  symbol: symbolType,
  transformer: effectsType,
  tuple: tupleType,
  undefined: undefinedType,
  union: unionType,
  unknown: unknownType,
  void: voidType,
})

export const coerce = {
  string(arg?: RawCreateParams & { coerce?: true }): ReturnType<ZodBuilders['string']> {
    return stringType({ ...arg, coerce: true })
  },
  number(arg?: RawCreateParams & { coerce?: boolean }): ReturnType<ZodBuilders['number']> {
    return numberType({ ...arg, coerce: true })
  },
  boolean(arg?: RawCreateParams & { coerce?: boolean }): ReturnType<ZodBuilders['boolean']> {
    return booleanType({ ...arg, coerce: true })
  },
  bigint(arg?: RawCreateParams & { coerce?: boolean }): ReturnType<ZodBuilders['bigint']> {
    return bigIntType({ ...arg, coerce: true })
  },
  date(arg?: RawCreateParams & { coerce?: boolean }): ReturnType<ZodBuilders['date']> {
    return dateType({ ...arg, coerce: true })
  },
}

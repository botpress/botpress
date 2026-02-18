import { zuiKey } from '../../../ui/constants'
import type { ZodErrorMap } from '../../error'
import type { ProcessedCreateParams, RawCreateParams } from '../index'

export type ZodParsedType =
  | 'string'
  | 'nan'
  | 'number'
  | 'integer'
  | 'float'
  | 'boolean'
  | 'date'
  | 'bigint'
  | 'symbol'
  | 'function'
  | 'undefined'
  | 'null'
  | 'array'
  | 'object'
  | 'unknown'
  | 'promise'
  | 'void'
  | 'never'
  | 'map'
  | 'set'

export const ZodParsedType = {
  string: 'string',
  nan: 'nan',
  number: 'number',
  integer: 'integer',
  float: 'float',
  boolean: 'boolean',
  date: 'date',
  bigint: 'bigint',
  symbol: 'symbol',
  function: 'function',
  undefined: 'undefined',
  null: 'null',
  array: 'array',
  object: 'object',
  unknown: 'unknown',
  promise: 'promise',
  void: 'void',
  never: 'never',
  map: 'map',
  set: 'set',
} as const satisfies { [k in ZodParsedType]: k }

export const getParsedType = (data: any): ZodParsedType => {
  const t = typeof data

  switch (t) {
    case 'undefined':
      return ZodParsedType.undefined

    case 'string':
      return ZodParsedType.string

    case 'number':
      return isNaN(data) ? ZodParsedType.nan : ZodParsedType.number

    case 'boolean':
      return ZodParsedType.boolean

    case 'function':
      return ZodParsedType.function

    case 'bigint':
      return ZodParsedType.bigint

    case 'symbol':
      return ZodParsedType.symbol

    case 'object':
      if (Array.isArray(data)) {
        return ZodParsedType.array
      }
      if (data === null) {
        return ZodParsedType.null
      }
      if (data.then && typeof data.then === 'function' && data.catch && typeof data.catch === 'function') {
        return ZodParsedType.promise
      }
      if (typeof Map !== 'undefined' && data instanceof Map) {
        return ZodParsedType.map
      }
      if (typeof Set !== 'undefined' && data instanceof Set) {
        return ZodParsedType.set
      }
      if (typeof Date !== 'undefined' && data instanceof Date) {
        return ZodParsedType.date
      }
      return ZodParsedType.object

    default:
      return ZodParsedType.unknown
  }
}

export function processCreateParams(
  params: RawCreateParams & ({ supportsExtensions?: 'secret'[] } | undefined)
): ProcessedCreateParams {
  if (!params) return {}

  const {
    errorMap,
    invalid_type_error,
    required_error,
    description,
    supportsExtensions,
    [zuiKey]: zuiExtensions,
  } = params

  if (errorMap && (invalid_type_error || required_error)) {
    throw new Error('Can\'t use "invalid_type_error" or "required_error" in conjunction with custom error map.')
  }

  const filteredZuiExtensions = zuiExtensions
    ? Object.fromEntries(
        Object.entries(zuiExtensions).filter(([key]) => key !== 'secret' || supportsExtensions?.includes('secret'))
      )
    : undefined

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

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

export const getParsedType = (data: any): ZodParsedType => {
  const t = typeof data

  switch (t) {
    case 'undefined':
      return 'undefined'

    case 'string':
      return 'string'

    case 'number':
      return isNaN(data) ? 'nan' : 'number'

    case 'boolean':
      return 'boolean'

    case 'function':
      return 'function'

    case 'bigint':
      return 'bigint'

    case 'symbol':
      return 'symbol'

    case 'object':
      if (Array.isArray(data)) {
        return 'array'
      }
      if (data === null) {
        return 'null'
      }
      if (data.then && typeof data.then === 'function' && data.catch && typeof data.catch === 'function') {
        return 'promise'
      }
      if (typeof Map !== 'undefined' && data instanceof Map) {
        return 'map'
      }
      if (typeof Set !== 'undefined' && data instanceof Set) {
        return 'set'
      }
      if (typeof Date !== 'undefined' && data instanceof Date) {
        return 'date'
      }
      return 'object'

    default:
      return 'unknown'
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

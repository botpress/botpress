import { ZodError } from './error'
import { ZodBaseTypeImpl } from './types'
import { IZodError, ZodType } from './typings'

export const isZuiError = (thrown: unknown): thrown is IZodError =>
  thrown instanceof ZodError || (thrown instanceof Error && '__type__' in thrown && thrown.__type__ === 'ZuiError')

export const isZuiType = (value: unknown): value is ZodType => value instanceof ZodBaseTypeImpl
// TODO: also accept objects with a __type__ property set to 'ZuiType' to allow for cross-realm compatibility
// || (typeof value === 'object' && value !== null && '__type__' in value && value.__type__ === 'ZuiType')

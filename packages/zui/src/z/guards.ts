import { IZodError } from './typings'
import { ZodNativeType } from './native'
import { ZodError } from './error'
import { ZodBaseTypeImpl } from './types'

export const isZuiError = (thrown: unknown): thrown is IZodError =>
  thrown instanceof ZodError || (thrown instanceof Error && '__type__' in thrown && thrown.__type__ === 'ZuiError')

export const isZuiType = (value: unknown): value is ZodNativeType =>
  value instanceof ZodBaseTypeImpl ||
  (typeof value === 'object' && value !== null && '__type__' in value && value.__type__ === 'ZuiType')

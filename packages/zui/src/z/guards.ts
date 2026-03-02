import { ZodError } from './error'
import { ZodBaseTypeImpl } from './types'
import { IZodError, ZodNativeType } from './typings'

const _isError = (value: unknown): value is Error => value instanceof Error
const _isObject = (value: unknown): value is object => typeof value === 'object' && value !== null

export const isZuiError = (thrown: unknown): thrown is IZodError =>
  thrown instanceof ZodError || (_isError(thrown) && '__type__' in thrown && thrown.__type__ === 'ZuiError')

export const isZuiType = (value: unknown): value is ZodNativeType =>
  value instanceof ZodBaseTypeImpl || (_isObject(value) && '__type__' in value && value.__type__ === 'ZuiType')

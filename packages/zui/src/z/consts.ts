import { ValidParseReturnType, InvalidParseReturnType, DirtyParseReturnType } from './typings'

export const zuiKey = 'x-zui' as const

export const OK = <T>(value: T): ValidParseReturnType<T> => ({ status: 'valid', value })
export const DIRTY = <T>(value: T): DirtyParseReturnType<T> => ({ status: 'dirty', value })
export const ERR: InvalidParseReturnType = { status: 'aborted' }

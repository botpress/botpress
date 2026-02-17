import { ZodType } from './types'

export { ZodType as Schema, ZodType as ZodSchema }

export * from './builders'
export { default } from './builders' // Re-export 'default' explicitly since export * doesn't handle it

export * from './types'
export * from './error'
export * from './types/utils'
export * from './types/utils/parseUtil'
export * from './types/utils/typeAliases'

/**
 * @deprecated - use ZodType instead
 */
export type ZodTypeAny = ZodType<any, any, any>

import { ZodType } from './types'

export { ZodType as Schema, ZodType as ZodSchema }

export * from './builders'
export { default } from './builders' // Re-export 'default' explicitly since export * doesn't handle it

export * from './types'
export * from './error'

/**
 * @deprecated - use ZodType instead
 */
export type ZodTypeAny = ZodType<any, any, any>

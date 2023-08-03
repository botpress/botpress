import type { z } from 'zod'

export type AnyZodObject = z.ZodObject<any>
export type Merge<A extends object, B extends object> = Omit<A, keyof B> & B
export type Cast<T, U> = T extends U ? T : U
export type Iof<T extends object> = { [K in keyof T]: T[K] }

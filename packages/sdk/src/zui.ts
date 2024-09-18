import { z } from '@bpinternal/zui'
export * from '@bpinternal/zui'

export type GenericZuiSchema<
  A extends Record<string, z.ZodTypeAny> = Record<string, z.ZodTypeAny>,
  R extends z.ZodTypeAny = z.ZodTypeAny
> = (typeArguments: A) => R

export default z

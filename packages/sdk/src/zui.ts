import { z } from '@bpinternal/zui'

export * from '@bpinternal/zui'

export type GenericZuiSchema<
  A extends Record<string, z.ZodTypeAny> = Record<string, z.ZodTypeAny>,
  R extends z.ZodTypeAny = z.ZodTypeAny,
> = (typeArguments: A) => R

export type ZuiObjectSchema = z.ZodObject | z.ZodRecord

export const mergeObjectSchemas = (a: ZuiObjectSchema, b: ZuiObjectSchema): ZuiObjectSchema => {
  if (a instanceof z.ZodObject && b instanceof z.ZodObject) {
    return a.merge(b)
  }
  if (a instanceof z.ZodRecord && b instanceof z.ZodRecord) {
    return z.record(z.intersection(a.valueSchema, b.valueSchema))
  }
  // TODO: adress this case
  throw new Error('Cannot merge object schemas with record schemas')
}

export default z

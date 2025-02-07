import { z } from '@bpinternal/zui'

export * from '@bpinternal/zui'

export type GenericZuiSchema<
  A extends Record<string, z.ZodTypeAny> = Record<string, z.ZodTypeAny>,
  R extends z.ZodTypeAny = z.ZodTypeAny,
> = (typeArguments: A) => R

export type ZuiObjectSchema = z.ZodObject | z.ZodRecord

export const mergeObjectSchemas = (a: ZuiObjectSchema, b: ZuiObjectSchema): ZuiObjectSchema => {
  const aDef = a._def
  const bDef = b._def

  if (aDef.typeName === z.ZodFirstPartyTypeKind.ZodObject && bDef.typeName === z.ZodFirstPartyTypeKind.ZodObject) {
    const aShape = aDef.shape()
    const bShape = bDef.shape()
    return z.object({ ...aShape, ...bShape })
  }
  if (aDef.typeName === z.ZodFirstPartyTypeKind.ZodRecord && bDef.typeName === z.ZodFirstPartyTypeKind.ZodRecord) {
    return z.record(z.intersection(aDef.valueType, bDef.valueType))
  }
  // TODO: adress this case
  throw new Error('Cannot merge object schemas with record schemas')
}

export default z

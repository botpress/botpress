import { ZodOptionalDef, ZodTypeAny } from '../../../z/index'
import { JsonSchema7Type, parseDef } from '../parseDef'
import { Refs } from '../Refs'

export const parseOptionalDef = (def: ZodOptionalDef, refs: Refs): JsonSchema7Type | undefined => {
  if (refs.currentPath.toString() === refs.propertyPath?.toString()) {
    return parseDef((def.innerType as ZodTypeAny)._def, refs)
  }

  const innerSchema = parseDef((def.innerType as ZodTypeAny)._def, {
    ...refs,
    currentPath: [...refs.currentPath, 'anyOf', '1'],
  })

  return innerSchema
    ? {
        anyOf: [
          {
            not: {},
          },
          innerSchema,
        ],
      }
    : {}
}

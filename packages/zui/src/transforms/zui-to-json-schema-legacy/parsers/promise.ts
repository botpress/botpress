import { ZodPromiseDef, ZodTypeAny } from '../../../z'
import { JsonSchema7Type, parseDef } from '../parseDef'
import { Refs } from '../Refs'

export function parsePromiseDef(def: ZodPromiseDef, refs: Refs): JsonSchema7Type | undefined {
  return parseDef((def.type as ZodTypeAny)._def, refs)
}

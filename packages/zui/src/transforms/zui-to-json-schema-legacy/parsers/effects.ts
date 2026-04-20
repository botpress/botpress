import { ZodEffectsDef, ZodTypeAny } from '../../../z'
import { JsonSchema7Type, parseDef } from '../parseDef'
import { Refs } from '../Refs'

export function parseEffectsDef(_def: ZodEffectsDef, refs: Refs): JsonSchema7Type | undefined {
  return refs.effectStrategy === 'input' ? parseDef((_def.schema as ZodTypeAny)._def, refs) : {}
}
